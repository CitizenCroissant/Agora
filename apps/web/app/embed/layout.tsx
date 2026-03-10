/**
 * Embed layout: no header/footer so widgets can be iframed cleanly.
 */
export default function EmbedLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
