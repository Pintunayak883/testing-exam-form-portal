import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";

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

export interface User extends ApplyFormData {
  status: "pending" | "approve" | "reject";
}

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

interface UserState {
  users: User[];
  masterSheetUsers: MasterSheetUser[];
  loading: boolean;
  error: string | null;
  loadingIds: string[];
}

const initialState: UserState = {
  users: [],
  masterSheetUsers: [],
  loading: false,
  error: null,
  loadingIds: [],
};

export const fetchUsers = createAsyncThunk<User[], void>(
  "users/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      const res = await axios.get("/api/admin/users");
      if (!res.data?.users || !Array.isArray(res.data.users)) {
        throw new Error("Invalid response format: users array missing");
      }
      return res.data.users.map((u: any) => ({
        ...u,
        id: u._id || u.id,
      })) as User[];
    } catch (err: any) {
      return rejectWithValue(err.message || "Failed to fetch users");
    }
  }
);

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
      return res.data.map((u: any) => ({
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
      })) as MasterSheetUser[];
    } catch (err: any) {
      return rejectWithValue(
        err.message || "Failed to fetch master sheet users"
      );
    }
  }
);

export const updateUserStatus = createAsyncThunk<
  { user: User; masterSheetUser?: MasterSheetUser },
  { id: string; status: "approve" | "reject" | "pending" }
>("users/updateStatus", async ({ id, status }, { rejectWithValue }) => {
  try {
    const res = await axios.put(`/api/admin/candidate/${id}`, { status });
    const u = res.data;
    const updatedUser = {
      ...u,
      id: u._id || u.id,
      status: u.status || status,
    } as User;

    let masterSheetUser: MasterSheetUser | undefined;
    if (status === "approve") {
      const masterSheetRes = await axios.put(
        `/api/admin/users/master-sheet/${id}`
      );
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
    return rejectWithValue(
      err.response?.data?.message ||
        err.message ||
        "Failed to update user status"
    );
  }
});

export const deleteUser = createAsyncThunk<string, string>(
  "users/deleteUser",
  async (id, { rejectWithValue }) => {
    try {
      await axios.delete(`/api/admin/candidate/${id}`);
      return id;
    } catch (err: any) {
      return rejectWithValue(err.message || "Failed to delete user");
    }
  }
);

export const resetAllStatuses = createAsyncThunk<User[], void>(
  "users/resetAllStatuses",
  async (_, { rejectWithValue }) => {
    try {
      const res = await axios.put("/api/admin/users/reset-statuses", {
        status: "pending",
      });
      return res.data.map((u: any) => ({
        ...u,
        id: u._id || u.id,
      })) as User[];
    } catch (err: any) {
      return rejectWithValue(err.message || "Failed to reset statuses");
    }
  }
);

const userSlice = createSlice({
  name: "users",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchUsers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.users = action.payload;
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchMasterSheetUsers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMasterSheetUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.masterSheetUsers = action.payload;
      })
      .addCase(fetchMasterSheetUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(updateUserStatus.pending, (state, action) => {
        const { id, status } = action.meta.arg;
        const index = state.users.findIndex((u) => u.id === id);
        if (index !== -1) {
          state.users[index].status = status;
        }
        state.loadingIds.push(id);
        state.error = null;
      })
      .addCase(updateUserStatus.fulfilled, (state, action) => {
        const { user, masterSheetUser } = action.payload;
        const index = state.users.findIndex((u) => u.id === user.id);
        if (index !== -1) {
          state.users[index] = user;
        }
        if (masterSheetUser) {
          const msIndex = state.masterSheetUsers.findIndex(
            (u) => u.id === masterSheetUser.id
          );
          if (msIndex === -1) {
            state.masterSheetUsers.push(masterSheetUser);
          } else {
            state.masterSheetUsers[msIndex] = masterSheetUser;
          }
        }
      })
      .addCase(updateUserStatus.rejected, (state, action) => {
        const { id } = action.meta.arg;
        const index = state.users.findIndex((u) => u.id === id);
        if (index !== -1) {
          state.users[index].status = "pending";
        }
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(deleteUser.fulfilled, (state, action) => {
        state.users = state.users.filter((u) => u.id !== action.payload);
        state.masterSheetUsers = state.masterSheetUsers.filter(
          (u) => u.userId !== action.payload
        );
      })
      .addCase(deleteUser.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      .addCase(resetAllStatuses.fulfilled, (state, action) => {
        state.users = action.payload;
      })
      .addCase(resetAllStatuses.rejected, (state, action) => {
        state.error = action.payload as string;
      });
  },
});

export default userSlice.reducer;
