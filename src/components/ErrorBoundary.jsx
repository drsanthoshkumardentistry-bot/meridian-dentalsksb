import React from "react";

/* Shows a friendly screen instead of a blank page if something crashes. */
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error) {
    // Log the technical error only; never log patient data
    console.error("MeriDent crashed:", error && error.message);
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center p-6 text-slate-800">
        <div role="alert" className="max-w-md w-full bg-white border border-blue-100 rounded-3xl shadow-xl p-8 text-center space-y-4">
          <div className="mx-auto w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-black">M</div>
          <h1 className="text-lg font-black text-slate-900">Something went wrong</h1>
          <p className="text-sm text-slate-600 leading-relaxed">
            MeriDent hit an unexpected problem. Your saved records are safe in the cloud. Reload the page to continue.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold"
          >
            Reload MeriDent
          </button>
        </div>
      </div>
    );
  }
}
