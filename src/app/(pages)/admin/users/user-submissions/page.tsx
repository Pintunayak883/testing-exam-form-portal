"use client";

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState, store } from "@/redux/store";
import {
  fetchUsers,
  updateUserStatus,
  deleteUser,
  User,
  resetAllStatuses,
} from "@/redux/userSlice";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ClipLoader } from "react-spinners";
import { useRouter } from "next/navigation";
import { Eye, Trash2 } from "lucide-react";

export default function AllCandidates() {
  const dispatch = useDispatch<typeof store.dispatch>();
  const { users, loading } = useSelector((state: RootState) => state.users);
  const router = useRouter();

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [updatingStatus, setUpdatingStatus] = useState<{
    [id: string]: boolean;
  }>({});
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  const [openResetDialog, setOpenResetDialog] = useState(false);
  const [dialogUserId, setDialogUserId] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const itemsPerPage = 10;

  useEffect(() => {
    dispatch(fetchUsers());
  }, [dispatch]);

  const filtered = users
    .filter((u) => {
      const mandatoryFields = [u.name, u.aadhaarNo, u.phone, u.email];
      const isComplete = mandatoryFields.every(
        (field) => field && field.trim() !== ""
      );

      if (!isComplete) return false;

      const searchLower = searchTerm.toLowerCase();
      const matchesSearch =
        u.name?.toLowerCase().includes(searchLower) ||
        u.aadhaarNo?.includes(searchLower) ||
        u.phone?.includes(searchLower) ||
        u.email?.toLowerCase().includes(searchLower);

      const matchesStatus = statusFilter === "all" || u.status === statusFilter;

      return matchesSearch && matchesStatus;
    })
    .sort((a, b) =>
      a.status === "pending" && b.status !== "pending"
        ? -1
        : b.status === "pending" && a.status !== "pending"
        ? 1
        : 0
    );

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const pageData = filtered.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleStatusUpdate = async (
    id: string,
    status: "approve" | "reject" | "pending"
  ) => {
    setUpdatingStatus((prev) => ({ ...prev, [id]: true }));

    try {
      await dispatch(updateUserStatus({ id, status })).unwrap();
      toast.success(`User status updated to ${status} successfully`);
    } catch {
      toast.error("Status update failed");
    } finally {
      setUpdatingStatus((prev) => ({ ...prev, [id]: false }));
    }
  };

  const handleDeleteUser = async (id: string) => {
    setDeletingUserId(id);
    try {
      await dispatch(deleteUser(id)).unwrap();
      toast.success("User deleted successfully");
      await dispatch(fetchUsers());
      if (pageData.length === 1 && currentPage > 1) {
        setCurrentPage((prev) => prev - 1);
      }
    } catch {
      toast.error("Failed to delete user");
    } finally {
      setDeletingUserId(null);
      setDialogUserId(null);
    }
  };

  const handleViewUser = (id: string) => {
    router.push(`/admin/users/user-submissions/viewform?id=${id}`);
  };

  const handleResetAllStatuses = async () => {
    try {
      await dispatch(resetAllStatuses()).unwrap();
      toast.success("All user statuses reset to pending successfully");
      setOpenResetDialog(false);
    } catch (error) {
      toast.error("Failed to reset statuses");
      console.error(error);
    }
  };

  return (
    <div className="h-full p-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>All Candidates</CardTitle>
            <Dialog
              open={openResetDialog}
              onOpenChange={(open) => setOpenResetDialog(open)}
            >
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  disabled={loading}
                  className="flex items-center gap-2 border-primary text-primary hover:bg-primary hover:text-white transition-colors duration-200"
                >
                  {loading ? (
                    <ClipLoader size={16} color="#666" className="mr-2" />
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9H9m-5 5a8.001 8.001 0 0015.356-2H15m-5 5v-5h-.582m-5.356-2A8.001 8.001 0 009 15h5"
                      />
                    </svg>
                  )}
                  Reset All Statuses
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Are you sure?</DialogTitle>
                  <DialogDescription>
                    This will reset the status of all users to "Pending". This
                    action cannot be undone.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setOpenResetDialog(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleResetAllStatuses}
                    disabled={loading}
                  >
                    {loading ? (
                      <ClipLoader size={16} color="#fff" className="mr-2" />
                    ) : null}
                    Yes, Reset
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <Input
              placeholder="Search by Name, Aadhaar, Phone, Email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full sm:w-1/2"
            />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-1/2">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approve">Approve</SelectItem>
                <SelectItem value="reject">Reject</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Aadhaar</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center py-4 text-gray-500"
                  >
                    <div className="flex justify-center items-center">
                      <ClipLoader size={24} color="#666" />
                      <span className="ml-2">Loading...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : pageData.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center py-6 text-gray-600 text-lg font-semibold"
                  >
                    No candidates found
                  </TableCell>
                </TableRow>
              ) : (
                pageData.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell>{u.name}</TableCell>
                    <TableCell>{u.aadhaarNo}</TableCell>
                    <TableCell>{u.phone}</TableCell>
                    <TableCell>{u.currentDate}</TableCell>
                    <TableCell>
                      <Select
                        value={u.status}
                        onValueChange={(value) =>
                          handleStatusUpdate(
                            u.id,
                            value as "approve" | "reject" | "pending"
                          )
                        }
                        disabled={updatingStatus[u.id]}
                      >
                        <SelectTrigger
                          className={`w-[120px] ${
                            u.status === "pending"
                              ? "text-yellow-500 border-yellow-500"
                              : u.status === "approve"
                              ? "text-green-500 border-green-500"
                              : "text-destructive border-destructive"
                          }`}
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="approve">Approve</SelectItem>
                          <SelectItem value="reject">Reject</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="flex gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleViewUser(u.id)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Dialog
                        open={dialogUserId === u.id}
                        onOpenChange={(open) => {
                          if (open) {
                            setDialogUserId(u.id);
                          } else {
                            setDialogUserId(null);
                          }
                        }}
                      >
                        <DialogTrigger asChild>
                          <Button variant="outline" size="icon">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Are you sure?</DialogTitle>
                            <DialogDescription>
                              Do you want to delete this user? This action
                              cannot be undone.
                            </DialogDescription>
                          </DialogHeader>
                          <DialogFooter>
                            <Button
                              variant="outline"
                              onClick={() => setOpenDialog(false)}
                            >
                              Cancel
                            </Button>
                            <Button
                              variant="destructive"
                              onClick={() => handleDeleteUser(u.id)}
                              disabled={deletingUserId === u.id}
                            >
                              {deletingUserId === u.id ? (
                                <ClipLoader size={16} color="#fff" />
                              ) : (
                                "Delete"
                              )}
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
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
