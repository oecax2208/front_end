import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Login, reset } from "../fitur/AuthSlice";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import {
  FormControl,
  InputLabel,
  OutlinedInput,
  Stack,
  Button,
  FormControlLabel,
  Checkbox,
} from "@mui/material";
import { Eye, EyeSlash } from "@phosphor-icons/react";
import axios from "axios";
import useSWR from 'swr';

const MySwal = withReactContent(Swal);

const getApiBaseUrl = () => {
  const protocol = window.location.protocol === "https:" ? "https" : "http";
  const baseUrl = process.env.REACT_APP_URL.replace(/^https?:\/\//, "");
  return `${protocol}://${baseUrl}`;
};

const fetcher = url => axios.get(url).then(res => res.data);

export const LoginPage = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [isManualLogin, setIsManualLogin] = useState(false);

  const { user, isError, isSuccess, isLoading, message } = useSelector((state) => state.auth);
  const { data, error } = useSWR(`${getApiBaseUrl()}/`, fetcher);

  // Load saved credentials
  useEffect(() => {
    const savedUsername = localStorage.getItem("username");
    const savedPassword = localStorage.getItem("password");
    const savedRememberMe = localStorage.getItem("rememberMe") === "true";

    if (savedUsername && savedPassword && savedRememberMe) {
      setUsername(savedUsername);
      setPassword(savedPassword);
      setRememberMe(true);
    }
  }, []);

  // Handle login response
  useEffect(() => {
    if (isSuccess && user) {
      const userData = user.data || user;
      Swal.fire({
        icon: "success",
        title: "Login Berhasil!",
        text: `Selamat datang kembali ${userData.username}`,
        showConfirmButton: false,
        timer: 2000,
      });

      const userRole = userData.role;
      if (userRole === "admin" || userRole === "superadmin") {
        navigate("/Dashboard");
      } else if (userRole === "kasir") {
        navigate("/produkpercabang");
      }
    } else if (isError && message && isManualLogin) {
      Swal.fire({
        icon: "error",
        title: "Login Gagal!",
        text: message,
        confirmButtonText: "OK",
      });
    }
    
    if (isSuccess || isError) {
      dispatch(reset());
      setIsManualLogin(false);
    }
  }, [isSuccess, isError, message, user, navigate, dispatch, isManualLogin]);

  const handleLogin = async (e) => {
    e.preventDefault();
    
    if (!username || !password) {
      Swal.fire({
        icon: "warning",
        title: "Peringatan",
        text: "Username dan password wajib diisi!",
      });
      return;
    }
  
    if (rememberMe) {
      localStorage.setItem("username", username);
      localStorage.setItem("password", password);
      localStorage.setItem("rememberMe", "true");
    } else {
      localStorage.removeItem("username");
      localStorage.removeItem("password");
      localStorage.removeItem("rememberMe");
    }
  
    setIsManualLogin(true);
    try {
      await dispatch(Login({ username, password }));
    } catch (error) {
      console.error("Login error:", error);
    }
  };

  return (
    <Stack
      spacing={4}
      sx={{
        maxWidth: 400,
        margin: "auto",
        mt: 8,
        p: 4,
        boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
        borderRadius: "8px",
        backgroundColor: "#fff",
      }}
    >
      <form onSubmit={handleLogin}>
        <Stack spacing={3}>
          <FormControl variant="outlined" fullWidth>
            <InputLabel htmlFor="username">Username</InputLabel>
            <OutlinedInput
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              label="Username"
            />
          </FormControl>

          <FormControl variant="outlined" fullWidth>
            <InputLabel htmlFor="password">Password</InputLabel>
            <OutlinedInput
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              label="Password"
              endAdornment={
                showPassword ? (
                  <Eye size={24} cursor="pointer" onClick={() => setShowPassword(false)} />
                ) : (
                  <EyeSlash size={24} cursor="pointer" onClick={() => setShowPassword(true)} />
                )
              }
            />
          </FormControl>

          <FormControlLabel
            control={
              <Checkbox
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                color="primary"
              />
            }
            label="Remember Me"
          />

          <Button
            type="submit"
            variant="contained"
            color="primary"
            size="large"
            disabled={isLoading}
            fullWidth
          >
            {isLoading ? "Signing in..." : "Sign In"}
          </Button>
        </Stack>
      </form>
    </Stack>
  );
};