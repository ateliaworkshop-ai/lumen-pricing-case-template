import React from "react";

export default class SectionErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <p className="empty">
          This section failed to render. The rest of the tool is still usable.
        </p>
      );
    }
    return this.props.children;
  }
}
