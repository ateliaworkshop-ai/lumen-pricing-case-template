"""Local JSON evaluator; no server, persistence or network side effects."""
import argparse
import json
from pathlib import Path
import sys
from .contracts import ContractError, ENGINE_VERSION, SCHEMA_VERSION, load_scenario, snapshot
from .engine import evaluate


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('input', type=Path)
    parser.add_argument('--output', type=Path)
    args = parser.parse_args()
    try:
        result = snapshot(evaluate(load_scenario(json.loads(args.input.read_text()))))
    except (ContractError, json.JSONDecodeError, OSError) as e:
        print(json.dumps({'schema_version': SCHEMA_VERSION, 'engine_version': ENGINE_VERSION,
                          'status': 'invalid_input', 'reason': str(e)}), file=sys.stderr)
        return 2
    encoded = json.dumps(result, indent=2, allow_nan=False)+'\n'
    if args.output:
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_text(encoded)
    else:
        print(encoded, end='')
    return 0


if __name__ == '__main__':
    sys.exit(main())
