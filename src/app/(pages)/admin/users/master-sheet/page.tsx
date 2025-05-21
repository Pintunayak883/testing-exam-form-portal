"use client";

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState, store } from "@/redux/store";
import { fetchMasterSheetUsers } from "@/redux/userSlice";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ClipLoader } from "react-spinners";
import { useRouter } from "next/navigation";
import { Eye } from "lucide-react";

interface MasterSheetUser {
  id: string;
  userId: string;
  name: string;
  email: string;
  aadhaarNo: string;
  examCityPreference1: string;
  examCityPreference2: string;
  previousCdaExperience: string;
  cdaExperienceYears: string;
  cdaExperienceRole: string;
  approvedAt: string;
}

export default function MasterSheet() {
  const dispatch = useDispatch<typeof store.dispatch>();
  const { masterSheetUsers, loading, error } = useSelector(
    (state: RootState) => state.users
  );
  const router = useRouter();

  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    dispatch(fetchMasterSheetUsers());
  }, [dispatch]);

  const filteredUsers = masterSheetUsers
    .filter((user) => {
      const searchLower = searchTerm.toLowerCase();
      return (
        user.name?.toLowerCase().includes(searchLower) ||
        user.email?.toLowerCase().includes(searchLower) ||
        user.aadhaarNo?.includes(searchLower)
      );
    })
    .sort(
      (a, b) =>
        new Date(b.approvedAt).getTime() - new Date(a.approvedAt).getTime()
    );

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const pageData = filteredUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleViewUser = (id: string) => {
    router.push(`/admin/users/user-submissions/viewform?id=${id}`);
  };

  return (
    <div className="h-full p-6">
      <Card>
        <CardHeader>
          <CardTitle>Master Sheet</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <Input
              placeholder="Search by Name, Email, Aadhaar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full sm:w-1/2"
            />
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Aadhaar No</TableHead>
                <TableHead>Approved At</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center py-4 text-gray-500"
                  >
                    <div className="flex justify-center items-center">
                      <ClipLoader size={24} color="#666" />
                      <span className="ml-2">Loading...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : error ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center py-6 text-red-600 text-lg font-semibold"
                  >
                    Error: {error}
                  </TableCell>
                </TableRow>
              ) : pageData.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center py-6 text-gray-600 text-lg font-semibold"
                  >
                    No users found in master sheet
                  </TableCell>
                </TableRow>
              ) : (
                pageData.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.aadhaarNo || "N/A"}</TableCell>
                    <TableCell>
                      {new Date(user.approvedAt).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          <div className="flex justify-between mt-4">
            <Button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => p - 1)}
            >
              Previous
            </Button>
            <span>
              Page {currentPage} of {totalPages}
            </span>
            <Button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
