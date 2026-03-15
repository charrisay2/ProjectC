import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { Grade } from "../../types";
import api from "../../services/api"; // Thêm dòng này để gọi API thật

// Thêm hàm gọi API lấy điểm từ database
export const fetchGrades = createAsyncThunk(
  "grades/fetchGrades",
  async (studentId: string | number, { rejectWithValue }) => {
    try {
      const response = await api.get(`/grades?studentId=${studentId}`);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Lỗi khi tải điểm",
      );
    }
  },
);

interface GradeState {
  grades: Grade[];
  isLoading: boolean;
  error: string | null;
}

const initialState: GradeState = {
  grades: [], // <-- Đã xóa mockGrades, khởi tạo mảng rỗng
  isLoading: false,
  error: null,
};

const gradeSlice = createSlice({
  name: "grades",
  initialState,
  reducers: {
    updateGrade: (state, action) => {
      const index = state.grades.findIndex((g) => g.id === action.payload.id);
      if (index !== -1) {
        state.grades[index] = action.payload;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchGrades.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchGrades.fulfilled, (state, action) => {
        state.isLoading = false;
        state.grades = action.payload; // Nạp dữ liệu thật vào đây
      })
      .addCase(fetchGrades.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { updateGrade } = gradeSlice.actions;
export default gradeSlice.reducer;
