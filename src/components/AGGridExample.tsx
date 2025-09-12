"use client";

import { useState, useMemo } from "react";
import { AgGridReact } from "ag-grid-react";
import { ColDef } from "ag-grid-community";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";

interface SampleData {
  id: number;
  name: string;
  email: string;
  department: string;
  salary: number;
  status: string;
}

export function AGGridExample() {
  const [rowData] = useState<SampleData[]>([
    {
      id: 1,
      name: "John Doe",
      email: "john@example.com",
      department: "Engineering",
      salary: 75000,
      status: "Active",
    },
    {
      id: 2,
      name: "Jane Smith",
      email: "jane@example.com",
      department: "Marketing",
      salary: 65000,
      status: "Active",
    },
    {
      id: 3,
      name: "Bob Johnson",
      email: "bob@example.com",
      department: "Sales",
      salary: 70000,
      status: "Inactive",
    },
    {
      id: 4,
      name: "Alice Brown",
      email: "alice@example.com",
      department: "HR",
      salary: 60000,
      status: "Active",
    },
    {
      id: 5,
      name: "Charlie Wilson",
      email: "charlie@example.com",
      department: "Engineering",
      salary: 80000,
      status: "Active",
    },
  ]);

  const columnDefs: ColDef<SampleData>[] = useMemo(
    () => [
      {
        headerName: "ID",
        field: "id",
        width: 80,
        pinned: "left",
      },
      {
        headerName: "Name",
        field: "name",
        width: 150,
        filter: "agTextColumnFilter",
      },
      {
        headerName: "Email",
        field: "email",
        width: 200,
        filter: "agTextColumnFilter",
      },
      {
        headerName: "Department",
        field: "department",
        width: 150,
        filter: "agSetColumnFilter",
        cellEditor: "agSelectCellEditor",
        cellEditorParams: {
          values: ["Engineering", "Marketing", "Sales", "HR", "Finance"],
        },
      },
      {
        headerName: "Salary",
        field: "salary",
        width: 120,
        filter: "agNumberColumnFilter",
        valueFormatter: (params) => `$${params.value.toLocaleString()}`,
      },
      {
        headerName: "Status",
        field: "status",
        width: 120,
        filter: "agSetColumnFilter",
        cellStyle: (params) => ({
          backgroundColor: params.value === "Active" ? "#dcfce7" : "#fee2e2",
          color: params.value === "Active" ? "#166534" : "#991b1b",
        }),
      },
    ],
    []
  );

  const defaultColDef = useMemo(
    () => ({
      resizable: true,
      sortable: true,
      filter: true,
      editable: true,
    }),
    []
  );

  const onSelectionChanged = () => {
    console.log("Selection changed");
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          AG-Grid Example
          <Button size="sm" variant="outline">
            Export Data
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[400px] w-full">
          <div className="ag-theme-alpine h-full w-full">
            <AgGridReact
              rowData={rowData}
              columnDefs={columnDefs}
              defaultColDef={defaultColDef}
              animateRows={true}
              rowSelection="multiple"
              suppressRowClickSelection={true}
              onSelectionChanged={onSelectionChanged}
              pagination={true}
              paginationPageSize={10}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
