"use client";

import { useState, useEffect } from "react";
import type { DirectoryEntry } from "@/lib/shared";
import { getTypeIndicator } from "@/lib/shared";
import Breadcrumb from "@/components/Breadcrumb";

function useIsMobile(breakpoint = 600) {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${breakpoint}px)`);
    setIsMobile(mql.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, [breakpoint]);
  return isMobile;
}

type SortColumn = "name" | "date" | "description";
type SortOrder = "asc" | "desc";

interface DirectoryListingProps {
  path: string;
  entries: DirectoryEntry[];
}

export default function DirectoryListing({ path, entries }: DirectoryListingProps) {
  const isMobile = useIsMobile();
  const [sortColumn, setSortColumn] = useState<SortColumn>("name");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
  const colCount = isMobile ? 2 : 4;

  function handleSort(column: SortColumn) {
    if (sortColumn === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortOrder("asc");
    }
  }

  const sorted = [...entries].sort((a, b) => {
    if (a.isDirectory && !b.isDirectory) return -1;
    if (!a.isDirectory && b.isDirectory) return 1;

    let cmp = 0;
    switch (sortColumn) {
      case "name":
        cmp = a.name.localeCompare(b.name);
        break;
      case "date":
        cmp = a.date.localeCompare(b.date);
        break;
      case "description":
        cmp = a.description.localeCompare(b.description);
        break;
    }
    return sortOrder === "asc" ? cmp : -cmp;
  });

  const indicator = (col: SortColumn) => {
    if (sortColumn !== col) return "";
    return sortOrder === "asc" ? " ▲" : " ▼";
  };

  const parentHref = path === "/" ? null : "/" + path.split("/").filter(Boolean).slice(0, -1).join("/");

  return (
    <div className="directory-listing">
      <Breadcrumb path={path} />
      <table>
        <thead>
          <tr>
            {!isMobile && <th></th>}
            <th>
              <a href="#" onClick={(e) => { e.preventDefault(); handleSort("name"); }}>
                Name{indicator("name")}
              </a>
            </th>
            <th>
              <a href="#" onClick={(e) => { e.preventDefault(); handleSort("date"); }}>
                Last modified{indicator("date")}
              </a>
            </th>
            {!isMobile && (
              <th>
                <a href="#" onClick={(e) => { e.preventDefault(); handleSort("description"); }}>
                  Description{indicator("description")}
                </a>
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          <tr><td colSpan={colCount}><hr /></td></tr>
          {parentHref !== null && (
            <tr>
              {!isMobile && <td>[PARENTDIR]</td>}
              <td className="name-col"><a href={parentHref || "/"}>Parent Directory</a></td>
              <td></td>
              {!isMobile && <td></td>}
            </tr>
          )}
          {sorted.map((entry) => (
            <tr key={entry.name}>
              {!isMobile && <td>{getTypeIndicator(entry)}</td>}
              <td className="name-col"><a href={entry.href}>{entry.name}</a></td>
              <td>{entry.date}</td>
              {!isMobile && <td>{entry.description}</td>}
            </tr>
          ))}
          <tr><td colSpan={colCount}><hr /></td></tr>
        </tbody>
      </table>
      <address>Apache/2.4.54 (Unix) OpenSSL/1.1.1t Server at josephawallace.com Port 443</address>
    </div>
  );
}
