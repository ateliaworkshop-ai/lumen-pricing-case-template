"""Generate structural JSON Schemas from public types; business validation stays Python."""
from dataclasses import fields
from typing import get_args, get_origin, get_type_hints, Literal, Union
import types
import json
from pathlib import Path
from .contracts import Scenario, Evaluation, DecisionPolicy, Recommendation, ROIResult, UncertaintyResult
from .historical import ModelArtifact, HistoricalForecast


def schema_for(root):
    definitions = {}
    def build(cls):
        origin, args = get_origin(cls), get_args(cls)
        if origin in (Union, types.UnionType):
            return {'anyOf': [build(a) for a in args]}
        if origin is Literal:
            return {'enum': list(args)}
        if origin is tuple:
            if len(args) == 2 and args[1] is Ellipsis:
                return {'type': 'array', 'items': build(args[0])}
            return {'type': 'array', 'prefixItems': [build(a) for a in args], 'minItems': len(args), 'maxItems': len(args)}
        if origin is dict:
            return {'type': 'object', 'additionalProperties': build(args[1])}
        if cls is dict:
            return {'type': 'object'}  # input_snapshot, validated by Scenario at evaluation
        if hasattr(cls, '__dataclass_fields__'):
            name = cls.__name__
            if name not in definitions:
                definitions[name] = {}
                hints = get_type_hints(cls)
                definitions[name] = {'type': 'object', 'additionalProperties': False,
                    'properties': {f.name: build(hints[f.name]) for f in fields(cls)}, 'required': [f.name for f in fields(cls)]}
            return {'$ref': '#/$defs/'+name}
        return {'type': {str: 'string', float: 'number', int: 'integer', bool: 'boolean', type(None): 'null'}[cls]}
    return {'$schema': 'https://json-schema.org/draft/2020-12/schema', **build(root), '$defs': definitions}


if __name__ == '__main__':
    Path('schemas').mkdir(exist_ok=True)
    for cls in (Scenario, Evaluation, DecisionPolicy, Recommendation, ROIResult, UncertaintyResult, ModelArtifact, HistoricalForecast):
        Path(f'schemas/{cls.__name__}.schema.json').write_text(json.dumps(schema_for(cls), indent=2)+'\n')
