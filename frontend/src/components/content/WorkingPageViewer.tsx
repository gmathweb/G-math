interface WorkingPageViewerProps {
  url: string;
  title: string;
}

export function WorkingPageViewer({ url, title }: WorkingPageViewerProps) {
  return (
    <iframe
      src={url}
      sandbox="allow-scripts allow-same-origin"
      title={title}
      style={{ width: '100%', height: '100%', border: 'none' }}
    />
  );
}
