import * as React from "react";

type Props = {
  fallback: (error: unknown) => React.ReactNode;
};

type State = {
  hasError: boolean;
  error: unknown;
};

export class ErrorBoundary extends React.Component<
  React.PropsWithChildren<Props>,
  State
> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: undefined };
  }

  static getDerivedStateFromError(error: unknown): State {
    return { hasError: true, error: error };
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback(this.state.error);
    }

    return this.props.children;
  }
}
