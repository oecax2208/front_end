import React, { useState } from "react";
import useSWR, { mutate } from "swr";
import {
  Box,
  Button,
  Card,
  Modal,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
  TableContainer,
  Paper,
} from "@mui/material";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import axios from "axios";
import L from "leaflet";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

const getApiBaseUrl = () => {
  const protocol = window.location.protocol === "https:" ? "https" : "http";
  const baseUrl = process.env.REACT_APP_URL.replace(/^https?:\/\/+/, "");
  return `${protocol}://${baseUrl}`;
};

const fetcher = (url) => axios.get(url).then((res) => res.data.data);

export const Branch = () => {
  const { data: cabangData, error: cabangError } = useSWR(`${getApiBaseUrl()}/cabang`, fetcher);
  const cabang = cabangData || []; // Provide default empty array if data is undefined

  const [openModal, setOpenModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentCabang, setCurrentCabang] = useState({
    uuid: "",
    namacabang: "",
    alamat: "",
    koordinat: "",
  });

  const DefaultIcon = L.icon({
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
  });

  L.Marker.prototype.options.icon = DefaultIcon;

  const handleOpenModal = (cabang = null) => {
    if (cabang) {
      setIsEditing(true);
      setCurrentCabang(cabang);
    } else {
      setIsEditing(false);
      setCurrentCabang({ uuid: "", namacabang: "", alamat: "", koordinat: "" });
    }
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
    setCurrentCabang({ uuid: "", namacabang: "", alamat: "", koordinat: "" });
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setCurrentCabang((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveCabang = async () => {
    try {
      const [latitude, longitude] = (currentCabang.koordinat || "").split(",").map((val) => val.trim());

      const payload = {
        namacabang: currentCabang.namacabang,
        alamat: currentCabang.alamat,
        latitude: latitude || null,
        longitude: longitude || null,
      };

      if (isEditing) {
        await axios.put(`${getApiBaseUrl()}/updatecabang/${currentCabang.uuid}`, payload, {
          withCredentials: true,
        });
      } else {
        await axios.post(`${getApiBaseUrl()}/createcabang`, payload, {
          withCredentials: true,
        });
      }

      mutate(`${getApiBaseUrl()}/cabang`);
      handleCloseModal();
    } catch (error) {
      alert(error.response?.data?.message || "Failed to save cabang.");
    }
  };

  const handleDeleteCabang = async (uuid) => {
    if (!window.confirm("Apakah Anda yakin ingin menghapus cabang ini?")) return;

    try {
      await axios.delete(`${getApiBaseUrl()}/deletecabang/${uuid}`, { withCredentials: true });
      mutate(`${getApiBaseUrl()}/cabang`);
    } catch (error) {
      alert(error.response?.data?.message || "Failed to delete branch.");
    }
  };

  if (cabangError) return <Typography>Error loading data.</Typography>;
  if (!cabangData) return <Typography>Loading...</Typography>;

  return (
    <Box sx={{ padding: 2 }}>
      <Typography variant="h6" gutterBottom>
        Manajemen Cabang
      </Typography>
      <Button variant="contained" color="primary" onClick={() => handleOpenModal()}>
        Tambah Cabang
      </Button>
      <TableContainer component={Paper} sx={{ marginTop: 2 }}>
        <Table>
          <TableHead>
            <TableRow>
            <TableCell>No</TableCell>
              <TableCell>Nama Cabang</TableCell>
              <TableCell>Alamat</TableCell>
              <TableCell>Koordinat</TableCell>
              <TableCell>Aksi</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
  {cabang.map((branch, index) => (
    <TableRow key={branch.uuid}>
      <TableCell>{index + 1}</TableCell>
      <TableCell>{branch.namacabang}</TableCell>
      <TableCell>{branch.alamat}</TableCell>
      <TableCell>{branch.koordinat}</TableCell>
      <TableCell>
        <Button
          variant="outlined"
          color="primary"
          onClick={() => handleOpenModal(branch)}
          sx={{ marginRight: 1 }}
        >
          Edit
        </Button>
        <Button
          variant="outlined"
          color="secondary"
          onClick={() => handleDeleteCabang(branch.uuid)}
        >
          Hapus
        </Button>
      </TableCell>
    </TableRow>
  ))}
</TableBody>

        </Table>
      </TableContainer>

      <Modal open={openModal} onClose={handleCloseModal}>
        <Card sx={{ padding: 4, maxWidth: 500, margin: "auto", marginTop: "10%" }}>
          <Typography variant="h6" gutterBottom>
            {isEditing ? "Edit Cabang" : "Tambah Cabang"}
          </Typography>
          <TextField
            name="namacabang"
            label="Nama Cabang"
            fullWidth
            margin="normal"
            value={currentCabang.namacabang}
            onChange={handleFormChange}
          />
          <TextField
            name="alamat"
            label="Alamat"
            fullWidth
            margin="normal"
            value={currentCabang.alamat}
            onChange={handleFormChange}
          />
          <TextField
            name="koordinat"
            label="Koordinat (Lat,Lng)"
            fullWidth
            margin="normal"
            value={currentCabang.koordinat}
            onChange={handleFormChange}
          />
          <Box sx={{ display: "flex", justifyContent: "flex-end", marginTop: 2 }}>
            <Button onClick={handleCloseModal} sx={{ marginRight: 1 }}>
              Batal
            </Button>
            <Button variant="contained" onClick={handleSaveCabang}>
              Simpan
            </Button>
          </Box>
        </Card>
      </Modal>

      <Typography variant="h5" gutterBottom sx={{ marginTop: 4 }}>
        Lokasi Cabang
      </Typography>
      <MapContainer
        center={[-7.003011, 110.411597]}
        zoom={13}
        style={{ height: "400px", width: "100%" }}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        {cabang.map((item) => {
          const position = item.koordinat ? item.koordinat.split(",").map(Number) : null;
          if (position) {
            return (
              <Marker key={item.uuid} position={position}>
                <Popup>
                  <Typography>
                    <strong>{item.namacabang}</strong>
                    <br />
                    {item.alamat}
                  </Typography>
                </Popup>
              </Marker>
            );
          }
          return null;
        })}
      </MapContainer>
    </Box>
  );
};