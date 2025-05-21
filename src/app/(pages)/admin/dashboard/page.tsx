"use client";

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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDispatch, useSelector } from "react-redux";
import { RootState, store } from "@/redux/store";
import { useEffect, useState } from "react";
import {
  deleteUser,
  fetchUsers,
  resetAllStatuses,
  updateUserStatus,
} from "@/redux/userSlice";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
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

// Define User type
type User = {
  id: string;
  name: string;
  aadhaarNo: string;
  phone: string;
  currentDate: string;
  status: "pending" | "approve" | "reject";
};

// Loader component for table
const TableLoader = () => (
  <div className="flex justify-center items-center h-32">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
  </div>
);

// Empty state component
const NoSubmissions = () => (
  <div className="text-center py-6">
    <p className="text-muted-foreground">Submissions Not Found.</p>
  </div>
);

// Admin Dashboard Component
export default function AdminDashboard() {
  const dispatch = useDispatch<typeof store.dispatch>();
  const router = useRouter();

  // Redux State
  const { users, loading, error } = useSelector(
    (state: RootState) => state.users
  );

  // Local state for status update loader
  const [updatingStatus, setUpdatingStatus] = useState<{
    [id: string]: boolean;
  }>({});
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  const [openResetDialog, setOpenResetDialog] = useState(false);
  const [dialogUserId, setDialogUserId] = useState<string | null>(null);

  useEffect(() => {
    dispatch(fetchUsers());
  }, [dispatch]);

  // Handle status update
  const handleStatusUpdate = async (
    id: string,
    status: "approve" | "reject" | "pending"
  ) => {
    setUpdatingStatus((prev) => ({ ...prev, [id]: true }));

    try {
      await dispatch(updateUserStatus({ id, status })).unwrap();
      toast.success(`User status updated to ${status} successfully`);
    } catch (err) {
      console.error(err);
      toast.error("Status update failed");
    } finally {
      setUpdatingStatus((prev) => ({ ...prev, [id]: false }));
    }
  };

  // Status counts
  const total = users.length;
  const approved = users.filter((u) => u.status === "approve").length;
  const pending = users.filter((u) => u.status === "pending").length;
  const rejected = users.filter((u) => u.status === "reject").length;

  const handleDeleteUser = async (id: string) => {
    setDeletingUserId(id);
    try {
      await dispatch(deleteUser(id)).unwrap();
      toast.success("User deleted successfully");
      await dispatch(fetchUsers());
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
    <div className="h-full">
      {/* Header */}
      <header className="flex items-center justify-between p-4 bg-primary text-primary-foreground shadow-md mb-6">
        <div className="flex items-center">
          <h1 className="text-xl font-bold">Exam Form Portal</h1>
        </div>
      </header>

      {/* Overview Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="card-custom">
          <CardHeader>
            <CardTitle>Total Candidates</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-2xl font-bold text-primary">{total}</p>
          </CardContent>
        </Card>
        <Card className="card-custom">
          <CardHeader>
            <CardTitle>Pending Forms</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-2xl font-bold text-yellow-500">{pending}</p>
            <Link href={"/admin/users/user-submissions"}>
              <Button className="btn-custom mt-2 w-full">Review Now</Button>
            </Link>
          </CardContent>
        </Card>
        <Card className="card-custom">
          <CardHeader>
            <CardTitle>Approved Forms</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-2xl font-bold text-green-500">{approved}</p>
          </CardContent>
        </Card>
        <Card className="card-custom">
          <CardHeader>
            <CardTitle>Rejected Forms</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-2xl font-bold text-destructive">{rejected}</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Submissions */}
      <Card className="card-custom mb-6  ">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Recent Submissions</CardTitle>
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
          {loading ? (
            <TableLoader />
          ) : users.length === 0 ? (
            <NoSubmissions />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-left">Name</TableHead>
                  <TableHead className="text-left">Aadhaar No.</TableHead>
                  <TableHead className="text-left">Number</TableHead>
                  <TableHead className="text-left">Date</TableHead>
                  <TableHead className="text-left">Status</TableHead>
                  <TableHead className="text-left">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.slice(0, 3).map((submission: User) => (
                  <TableRow key={submission.id}>
                    <TableCell className="font-medium">
                      {submission.name}
                    </TableCell>
                    <TableCell>{submission.aadhaarNo}</TableCell>
                    <TableCell>{submission.phone}</TableCell>
                    <TableCell>{submission.currentDate}</TableCell>
                    <TableCell>
                      <Select
                        value={submission.status}
                        onValueChange={(value) =>
                          handleStatusUpdate(
                            submission.id,
                            value as "approve" | "reject" | "pending"
                          )
                        }
                        disabled={updatingStatus[submission.id]}
                      >
                        <SelectTrigger
                          className={`w-[120px] ${
                            submission.status === "pending"
                              ? "text-yellow-500 border-yellow-500"
                              : submission.status === "approve"
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
                        onClick={() => handleViewUser(submission.id)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Dialog
                        open={dialogUserId === submission.id}
                        onOpenChange={(open) => {
                          if (open) {
                            setDialogUserId(submission.id);
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
                              onClick={() => setDialogUserId(null)}
                            >
                              Cancel
                            </Button>
                            <Button
                              variant="destructive"
                              onClick={() => handleDeleteUser(submission.id)}
                              disabled={deletingUserId === submission.id}
                            >
                              {deletingUserId === submission.id ? (
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
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Form Management */}
      <Card className="card-custom mb-6">
        <CardHeader>
          <CardTitle>Form Management</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row gap-4">
          <Button className="btn-custom w-full sm:w-auto">
            Create New Form
          </Button>
          <Button variant="outline" className="w-full sm:w-auto">
            Edit Existing Form
          </Button>
          <Button variant="outline" className="w-full sm:w-auto">
            Set Form Visibility
          </Button>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card className="card-custom">
        <CardHeader>
          <CardTitle>Send Notifications</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Enter message for candidates..."
            className="mb-4 w-full bg-input text-foreground border-border"
          />
          <div className="flex flex-col sm:flex-row gap-4">
            <Button className="btn-custom w-full sm:w-auto">
              Send to All Candidates
            </Button>
            <Button variant="outline" className="w-full sm:w-auto">
              Send to Selected
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
