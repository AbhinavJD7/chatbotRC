import "../global.css";

export default function WidgetLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body style={{ margin: 0, padding: 0, overflow: 'hidden', background: 'transparent' }}>
        {children}
      </body>
    </html>
  );
}
