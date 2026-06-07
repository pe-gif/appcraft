import { KitViewer } from "@/components/kit/kit-viewer";

export default function ApplicationKitPage({ params }: { params: { id: string } }) {
  return <KitViewer id={params.id} />;
}
