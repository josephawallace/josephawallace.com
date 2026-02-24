import Link from "next/link";

interface BreadcrumbProps {
  path: string;
}

export default function Breadcrumb({ path }: BreadcrumbProps) {
  const segments = path.split("/").filter(Boolean);

  return (
    <h1 className="breadcrumb">
      Index of /
      <Link href="/">josephawallace.com</Link>
      /
      {segments.map((segment, i) => {
        const isLast = i === segments.length - 1;
        const href = "/" + segments.slice(0, i + 1).join("/");

        return (
          <span key={i}>
            <Link href={href}>{segment}</Link>{isLast && !path.endsWith("/") ? "" : "/"}
          </span>
        );
      })}
    </h1>
  );
}
