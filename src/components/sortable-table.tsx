"use client";

import React, { useState, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";

export type SortDirection = "asc" | "desc" | null;

export interface ColumnDef<T> {
  key: string;
  label: string;
  sortable?: boolean;
  render?: (value: unknown, row: T, index: number) => React.ReactNode;
  className?: string;
  headerClassName?: string;
  sticky?: boolean; // Makes column sticky on horizontal scroll
}

interface SortableTableProps<T> {
  title?: string;
  columns: ColumnDef<T>[];
  data: T[];
  defaultSortKey?: string;
  defaultSortDirection?: "asc" | "desc";
  emptyMessage?: string;
}

export function SortableTable<T extends Record<string, unknown>>({
  title,
  columns,
  data,
  defaultSortKey,
  defaultSortDirection = "desc",
  emptyMessage = "No data available",
}: SortableTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(
    defaultSortKey || null
  );
  const [sortDirection, setSortDirection] = useState<SortDirection>(
    defaultSortKey ? defaultSortDirection : null
  );

  const handleSort = (key: string, sortable: boolean = true) => {
    if (!sortable) return;

    if (sortKey === key) {
      // Cycle through: desc -> asc -> null
      if (sortDirection === "desc") {
        setSortDirection("asc");
      } else if (sortDirection === "asc") {
        setSortDirection(null);
        setSortKey(null);
      }
    } else {
      setSortKey(key);
      setSortDirection("desc");
    }
  };

  const sortedData = useMemo(() => {
    if (!sortKey || !sortDirection) return data;

    return [...data].sort((a, b) => {
      const aValue = a[sortKey];
      const bValue = b[sortKey];

      // Handle null/undefined
      if (aValue == null && bValue == null) return 0;
      if (aValue == null) return 1;
      if (bValue == null) return -1;

      // Compare values
      let comparison = 0;
      if (typeof aValue === "number" && typeof bValue === "number") {
        comparison = aValue - bValue;
      } else {
        comparison = String(aValue).localeCompare(String(bValue));
      }

      return sortDirection === "asc" ? comparison : -comparison;
    });
  }, [data, sortKey, sortDirection]);

  const getSortIcon = (key: string, sortable: boolean = true) => {
    if (!sortable) return null;

    if (sortKey !== key) {
      return <ArrowUpDown className="ml-2 h-4 w-4" />;
    }

    if (sortDirection === "desc") {
      return <ArrowDown className="ml-2 h-4 w-4" />;
    }

    return <ArrowUp className="ml-2 h-4 w-4" />;
  };

  return (
    <Card>
      {title && (
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
      )}
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead
                  key={column.key}
                  className={`${column.headerClassName || ""} ${
                    column.sortable !== false
                      ? "cursor-pointer select-none hover:bg-muted/50"
                      : ""
                  } ${
                    column.sticky
                      ? "sticky left-0 z-10 bg-card shadow-[2px_0_4px_-2px_rgba(0,0,0,0.1)]"
                      : ""
                  }`}
                  onClick={() =>
                    handleSort(column.key, column.sortable !== false)
                  }
                >
                  <div className="flex items-center">
                    {column.label}
                    {getSortIcon(column.key, column.sortable !== false)}
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedData.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="text-center text-muted-foreground"
                >
                  {emptyMessage}
                </TableCell>
              </TableRow>
            ) : (
              sortedData.map((row, index) => (
                <TableRow key={index}>
                  {columns.map((column) => (
                    <TableCell
                      key={column.key}
                      className={`${column.className || ""} ${
                        column.sticky
                          ? "sticky left-0 z-10 bg-card shadow-[2px_0_4px_-2px_rgba(0,0,0,0.1)]"
                          : ""
                      }`}
                    >
                      {column.render
                        ? column.render(row[column.key], row, index)
                        : (row[column.key] as React.ReactNode)}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
