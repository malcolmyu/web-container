import { useState } from 'react';

export default function Preview({ url }) {
  const [loaded, setLoaded] = useState(false);

  if (!url) {
    return (
      <div className="preview-empty">
        <div className="loading-spinner" />
        <p>Waiting for dev server...</p>
      </div>
    );
  }

  return (
    <div className="preview-container">
      {!loaded && (
        <div className="preview-loading">
          <div className="loading-spinner" />
        </div>
      )}
      <iframe
        src={url}
        className="preview-iframe"
        style={{ opacity: loaded ? 1 : 0 }}
        onLoad={() => setLoaded(true)}
        title="preview"
        sandbox="allow-scripts allow-same-origin"
      />
    </div>
  );
}
