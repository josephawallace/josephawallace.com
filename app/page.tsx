import DirectoryListing from "@/components/DirectoryListing";
import { readDirectory } from "@/lib/content";

export default function Home() {
  const entries = readDirectory("");

  return <DirectoryListing path="/" entries={entries} />;
}
