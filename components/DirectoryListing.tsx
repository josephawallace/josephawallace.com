"use client";

import { useState } from "react";
import type { DirectoryEntry } from "@/lib/shared";
import { getTypeIndicator, formatSize } from "@/lib/shared";

type SortColumn = "name" | "date" | "size" | "description";
type SortOrder = "asc" | "desc";

interface DirectoryListingProps {
  path: string;
  entries: DirectoryEntry[];
}

export default function DirectoryListing({ path, entries }: DirectoryListingProps) {
  const [sortColumn, setSortColumn] = useState<SortColumn>("name");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");

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
      case "size":
        cmp = a.size - b.size;
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

  const displayPath = path === "/" ? "/josephawallace.com/" : `/josephawallace.com${path}`;
  const parentHref = path === "/" ? null : "/" + path.split("/").filter(Boolean).slice(0, -1).join("/");

  return (
    <div className="directory-listing">
      <h1>Index of {displayPath}</h1>
      <table>
        <thead>
          <tr>
            <th></th>
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
            <th>
              <a href="#" onClick={(e) => { e.preventDefault(); handleSort("size"); }}>
                Size{indicator("size")}
              </a>
            </th>
            <th>
              <a href="#" onClick={(e) => { e.preventDefault(); handleSort("description"); }}>
                Description{indicator("description")}
              </a>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr><td colSpan={5}><hr /></td></tr>
          {parentHref !== null && (
            <tr>
              <td>[PARENTDIR]</td>
              <td><a href={parentHref || "/"}>Parent Directory</a></td>
              <td></td>
              <td>-</td>
              <td></td>
            </tr>
          )}
          {sorted.map((entry) => (
            <tr key={entry.name}>
              <td>{getTypeIndicator(entry)}</td>
              <td><a href={entry.href}>{entry.name}</a></td>
              <td>{entry.date}</td>
              <td className="size-col">{entry.isDirectory ? "-" : formatSize(entry.size)}</td>
              <td>{entry.description}</td>
            </tr>
          ))}
          <tr><td colSpan={5}><hr /></td></tr>
        </tbody>
      </table>
      <address>Apache/2.4.54 (Unix) OpenSSL/1.1.1t Server at josephawallace.com Port 443</address>
    </div>
  );
}
