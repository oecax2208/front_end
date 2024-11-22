import {createSlice, createAsyncThunk} from "@reduxjs/toolkit";
import axios from 'axios';

const getApiBaseUrl = () => {
    const protocol = window.location.protocol === 'https:' ? 'https' : 'http';
    const baseUrl = process.env.REACT_APP_URL.replace(/^https?:\/\//, '');
    return `${protocol}://${baseUrl}`;
};

const initialState = {  
   // user: null,
   user: null,
    isError: false,
    isSuccess: false,
    isLoading: false,
    message: "",
    isAuthenticated: false,
}

export const Login = createAsyncThunk("user/login", async (user, thunkAPI) => {
    try {
        const response = await axios.post(`${getApiBaseUrl()}/login`,
            new URLSearchParams({
                username: user.username,
                password: user.password
            }), {
            withCredentials: true,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            }
        });
     //   console.log("Login response:", response.data);
        return response.data;
    } catch (error) {
        if (error.response) {
            const message = error.response.data.message;
            console.log("Error response:", error.response.data);
            return thunkAPI.rejectWithValue(message);
        }
    }
});

export const Me = createAsyncThunk("user/me", async(__, thunkAPI) => {
    try {
        const response = await axios.get(`${getApiBaseUrl()}/me`,
    {withCredentials: true}
    );console.log('Response /me:', response.data);
    return response.data;
    } catch (error) {
        if (error.response) {
            const message = error.response.data.msg;
            return thunkAPI.rejectWithValue(message);
        };
    }
});

export const Logout = createAsyncThunk("user/logout", async() => {
await axios.delete(`${getApiBaseUrl()}/logout`);
 });

 export const authSlice = createSlice({
    name: "auth",
    initialState,
    reducers: {
        reset: (state) => initialState,
    },
    extraReducers: (builder) => {
        builder.addCase(Login.pending, (state) => {
            state.isLoading = true;
        });
        builder.addCase(Login.fulfilled, (state, action) => {
          //  console.log('Data login:', action.payload);
            state.isLoading = false;
            state.isSuccess = true;
            state.user = action.payload;
            state.isAuthenticated = true;
        });
        builder.addCase(Login.rejected, (state, action) => {
          //  console.log("Rejected action payload:", action.payload);
            state.isLoading = false;
            state.isError = true;
            state.message = action.payload;
        });

        builder.addCase(Me.pending, (state) => {
            state.isLoading = true;
        });
        builder.addCase(Me.fulfilled, (state, action) => {
           // console.log('Data pengguna dari API /me:', action.payload);
            state.isLoading = false;
            state.isSuccess = true;
            state.user = action.payload;
            state.isAuthenticated = true;
        });
        builder.addCase(Me.rejected, (state, action) => {
            state.isLoading = false;
            state.isError = true;
            state.message = action.payload;
        });

        builder.addCase(Logout.fulfilled, (state) => {
            state.user = null;
            state.isAuthenticated = false;
        });
    },
});


export const{ reset } = authSlice.actions;
export default authSlice.reducer;

