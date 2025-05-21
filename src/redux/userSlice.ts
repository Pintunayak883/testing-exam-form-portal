import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";

// Interface for ApplyFormData
interface ApplyFormData {
  id: string;
  name: string;
  email: string;
  dob: string;
  phone: string;
  area: string;
  landmark: string;
  address: string;
  examCityPreference1: string;
  examCityPreference2: string;
  previousCdaExperience: string;
  cdaExperienceYears: string;
  cdaExperienceRole: string;
  photo: string | null;
  signature: string | null;
  thumbprint: string | null;
  aadhaarNo: string;
  penaltyClauseAgreement: boolean;
  fever: string;
  cough: string;
  breathlessness: string;
  soreThroat: string;
  otherSymptoms: string;
  otherSymptomsDetails: string;
  closeContact: string;
  covidDeclarationAgreement: boolean;
  accountHolderName: string;
  bankName: string;
  ifsc: string;
  branch: string;
  bankAccountNo: string;
  currentDate: string;
  sonOf: string;
  resident: string;
}

// User interface extends ApplyFormData
export interface User extends ApplyFormData {
  status: "pending" | "approve" | "reject";
}

// MasterSheetUser interface
export interface MasterSheetUser {
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

// UserState interface (single definition)
interface UserState {
  users: User[];
  masterSheetUsers: MasterSheetUser[];
  loading: boolean;
  error: string | null;
  loadingIds: string[];
}

// Initial state
const initialState: UserState = {
  users: [],
  masterSheetUsers: [],
  loading: false,
  error: null,
  loadingIds: [],
};

// Fetch all users
export const fetchUsers = createAsyncThunk<User[], void>(
  "users/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      const res = await axios.get("/api/admin/users");
      if (!res.data?.users || !Array.isArray(res.data.users)) {
        throw new Error("Invalid response format: users array missing");
      }
      const users = res.data.users.map((u: any) => {
        if (!u._id && !u.id) {
          console.error("Invalid user data: ID missing", u);
          throw new Error("User ID missing in response");
        }
        return {
          ...u,
          id: u._id || u.id,
        };
      });
      return users as User[];
    } catch (err: any) {
      console.error("Fetch users error:", err);
      return rejectWithValue(
        err.message || "Failed to fetch users. Please try again."
      );
    }
  }
);

// Fetch master sheet users
export const fetchMasterSheetUsers = createAsyncThunk<MasterSheetUser[], void>(
  "users/fetchMasterSheet",
  async (_, { rejectWithValue }) => {
    try {
      const res = await axios.get("/api/admin/users/master-sheet");
      if (!Array.isArray(res.data)) {
        throw new Error(
          "Invalid response format: master sheet users array missing"
        );
      }
      const users = res.data.map((u: any) => {
        if (!u._id && !u.id) {
          console.error("Invalid master sheet user data: ID missing", u);
          throw new Error("Master sheet user ID missing in response");
        }
        return {
          id: u._id || u.id,
          userId: u.userId || "",
          name: u.name || "",
          email: u.email || "",
          aadhaarNo: u.aadhaarNo || "",
          examCityPreference1: u.examCityPreference1 || "",
          examCityPreference2: u.examCityPreference2 || "",
          previousCdaExperience: u.previousCdaExperience || "",
          cdaExperienceYears: u.cdaExperienceYears || "",
          cdaExperienceRole: u.cdaExperienceRole || "",
          approvedAt: u.approvedAt || new Date().toISOString(),
        };
      });
      return users as MasterSheetUser[];
    } catch (err: any) {
      console.error("Fetch master sheet users error:", err);
      return rejectWithValue(
        err.message || "Failed to fetch master sheet users. Please try again."
      );
    }
  }
);

// Update user status - CHANGE STARTS HERE
export const updateUserStatus = createAsyncThunk<
  { user: User; masterSheetUser?: MasterSheetUser }, // Changed return type to include masterSheetUser
  { id: string; status: "approve" | "reject" | "pending" }
>(
  "users/updateStatus",
  async ({ id, status }, { rejectWithValue, dispatch }) => {
    try {
      if (!id) {
        throw new Error("User ID is required");
      }

      // Step 1: Update user status
      const res = await axios.put(`/api/admin/candidate/${id}`, { status });

      const u = res.data;

      if (!u || (!u._id && !u.id)) {
        throw new Error("Invalid response: updated user ID missing");
      }

      const updatedUser = {
        ...u,
        id: u._id || u.id,
        status: u.status || status,
      } as User;

      // Step 2: If status is "approve", add to MasterSheet - NEW LOGIC ADDED
      let masterSheetUser: MasterSheetUser | undefined;
      if (status === "approve") {
        const masterSheetRes = await axios.put(
          `/api/admin/users/master-sheet/${id}`,
          {}
        );
        if (!masterSheetRes.data || !masterSheetRes.data.message) {
          throw new Error("Failed to add user to master sheet");
        }
        const msUser = masterSheetRes.data.user || updatedUser;
        masterSheetUser = {
          id: msUser._id || msUser.id,
          userId: msUser.userId || id,
          name: msUser.name || "",
          email: msUser.email || "",
          aadhaarNo: msUser.aadhaarNo || "",
          examCityPreference1: msUser.examCityPreference1 || "",
          examCityPreference2: msUser.examCityPreference2 || "",
          previousCdaExperience: msUser.previousCdaExperience || "",
          cdaExperienceYears: msUser.cdaExperienceYears || "",
          cdaExperienceRole: msUser.cdaExperienceRole || "",
          approvedAt: msUser.approvedAt || new Date().toISOString(),
        };
      }

      return { user: updatedUser, masterSheetUser };
    } catch (err: any) {
      console.error(
        "Update user status error:",
        err.response?.data || err.message
      );
      return rejectWithValue(
        err.response?.data?.message ||
          err.message ||
          "Failed to update user status. Please try again."
      );
    }
  }
);
// CHANGE ENDS HERE

// Delete user
export const deleteUser = createAsyncThunk<string, string>(
  "users/deleteUser",
  async (id, { rejectWithValue }) => {
    try {
      if (!id) {
        throw new Error("User ID is required");
      }
      await axios.delete(`/api/admin/candidate/${id}`);
      return id;
    } catch (err: any) {
      console.error("Delete user error:", err);
      return rejectWithValue(
        err.message || "Failed to delete user. Please try again."
      );
    }
  }
);

// Reset all statuses
export const resetAllStatuses = createAsyncThunk<User[], void>(
  "users/resetAllStatuses",
  async (_, { rejectWithValue }) => {
    try {
      const res = await axios.put("/api/admin/users/reset-statuses", {
        status: "pending",
      });
      if (!res.data || !Array.isArray(res.data)) {
        throw new Error("Invalid response: users array missing");
      }
      const users = res.data.map((u: any) => {
        if (!u._id && !u.id) {
          console.error("Invalid user data: ID missing", u);
          throw new Error("User ID missing in response");
        }
        return {
          ...u,
          id: u._id || u.id,
        };
      });
      return users as User[];
    } catch (err: any) {
      console.error("Reset statuses error:", err);
      return rejectWithValue(
        err.message || "Failed to reset statuses. Please try again."
      );
    }
  }
);

const userSlice = createSlice({
  name: "users",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // fetchUsers handlers
      .addCase(fetchUsers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUsers.fulfilled, (state, action: PayloadAction<User[]>) => {
        state.loading = false;
        state.users = action.payload;
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // fetchMasterSheetUsers handlers
      .addCase(fetchMasterSheetUsers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchMasterSheetUsers.fulfilled,
        (state, action: PayloadAction<MasterSheetUser[]>) => {
          state.loading = false;
          state.masterSheetUsers = action.payload;
        }
      )
      .addCase(fetchMasterSheetUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // updateUserStatus handlers - CHANGE STARTS HERE
      .addCase(updateUserStatus.pending, (state, action) => {
        const { id, status } = action.meta.arg;
        const userIndex = state.users.findIndex((u) => u.id === id);
        if (userIndex !== -1) {
          state.users[userIndex].status = status;
        }
        state.loadingIds.push(id);
        state.error = null;
      })
      .addCase(
        updateUserStatus.fulfilled,
        (
          state,
          action: PayloadAction<{
            user: User;
            masterSheetUser?: MasterSheetUser;
          }>
        ) => {
          state.loading = false;
          const updatedUser = action.payload.user;
          const index = state.users.findIndex((u) => u.id === updatedUser.id);
          if (index !== -1) {
            state.users[index] = updatedUser;
          }
          // If masterSheetUser exists, add to masterSheetUsers - NEW LOGIC ADDED
          if (action.payload.masterSheetUser) {
            const exists = state.masterSheetUsers.some(
              (u) => u.id === action.payload.masterSheetUser!.id
            );
            if (!exists) {
              state.masterSheetUsers.push(action.payload.masterSheetUser);
            } else {
              state.masterSheetUsers = state.masterSheetUsers.map((u) =>
                u.id === action.payload.masterSheetUser!.id
                  ? action.payload.masterSheetUser!
                  : u
              );
            }
          }
        }
      )
      .addCase(updateUserStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        console.log("Status update failed:", action.payload);
        // Rollback status if needed - NEW LOGIC ADDED
        const { id, status } = action.meta.arg;
        const userIndex = state.users.findIndex((u) => u.id === id);
        if (userIndex !== -1) {
          state.users[userIndex].status = "pending";
        }
      })
      // CHANGE ENDS HERE
      // deleteUser handlers
      .addCase(deleteUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteUser.fulfilled, (state, action: PayloadAction<string>) => {
        state.loading = false;
        state.users = state.users.filter((user) => user.id !== action.payload);
        state.masterSheetUsers = state.masterSheetUsers.filter(
          (user) => user.userId !== action.payload
        );
      })
      .addCase(deleteUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // resetAllStatuses handlers
      .addCase(resetAllStatuses.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        resetAllStatuses.fulfilled,
        (state, action: PayloadAction<User[]>) => {
          state.loading = false;
          state.users = action.payload;
        }
      )
      .addCase(resetAllStatuses.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export default userSlice.reducer;
