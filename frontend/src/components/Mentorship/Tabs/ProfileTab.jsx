import { useEffect, useState } from "react";
import {
  Box, Button, Typography, CircularProgress, Paper, Dialog, DialogTitle,
  DialogContent, Stepper, Step, StepLabel, IconButton, Snackbar, Alert
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import CloseIcon from "@mui/icons-material/Close";
import Step1 from "../step1";
import Step2 from "../step2";
import Step3 from "../step3";
import Step4 from "../step4";
import UserProfileDetails from "./userProfileDetails";

const steps = ["Role", "Basic Info", "Skills", "Additional Info"];

const ProfileTab = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [formData, setFormData] = useState({});
  const [activeStep, setActiveStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");
  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false);

  const navigate = useNavigate();

  // Get user ID from session storage
  const userId = sessionStorage.getItem("id");

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/users/profile/${userId}`);
        console.log("fetch res = ",res);
        const data = await res.json();
        setProfile(data);
      } catch (err) {
        setProfile(null);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [userId]);

  const handleEditOpen = () => {
    setFormData(profile); // Ensure formData is prefilled with profile details
    setActiveStep(0);
    setEditOpen(true);
  };

  const handleEditClose = () => {
    setEditOpen(false);
  };

  const handleNext = () => setActiveStep((prev) => prev + 1);
  const handleBack = () => setActiveStep((prev) => prev - 1);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`http://localhost:5000/api/users/update/${userId}` , {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        const updated = await res.json();
        setProfile(updated);
        setSnackbarOpen(true);
        setSnackbarMessage("Profile updated successfully!");
        setSnackbarSeverity("success");
        setTimeout(() => {
          setEditOpen(false);
        }, 1000)
      } 
      else {
        const errData = await res.json();
        setSnackbarMessage(errData.message || "Failed to update profile.");
        setSnackbarSeverity("error");
        setSnackbarOpen(true);
      }
    } catch (err) {
      // Optionally show error
      setSnackbarMessage("Network error while updating profile.");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    } finally {
      setSaving(false);
    }
  };

  const handleLeaveProgram = async () => {
    try {
      const res = await fetch(`http://localhost:5000/api/users/leave-program/${userId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        sessionStorage.clear();
        navigate("/mentorship");
      }
      else {
        const errData = await res.json();
        setSnackbarMessage(errData.message || "Failed to leave program.");
        setSnackbarSeverity("error");
        setSnackbarOpen(true);
      }
    } catch (err) {
      // Show error snackbar
      setSnackbarMessage("Network error while leaving program.");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    }
  };

  const getStepContent = (step) => {
    switch (step) {
      case 0:
        return <Step1 formData={formData} setFormData={setFormData} onNext={handleNext} isEdit />;
      case 1:
        return <Step2 formData={formData} setFormData={setFormData} onNext={handleNext} onBack={handleBack} isEdit />;
      case 2:
        return <Step3 formData={formData} setFormData={setFormData} onNext={handleNext} onBack={handleBack} isEdit />;
      case 3:
        return <Step4 formData={formData} setFormData={setFormData} onBack={handleBack} onNext={handleSave} isEdit saving={saving} />;
      default:
        return null;
    }
  };

  if (loading) return <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}><CircularProgress /></Box>;
  if (!profile) return <Typography color="error">Unable to load profile.</Typography>;

  return (
    <Paper sx={{ p: 4, maxWidth: 600, mx: "auto", mt: 4, mb: 6,  borderRadius: 4, boxShadow: 6 }}>
      <UserProfileDetails profile={profile} showEdit onEdit={handleEditOpen} />
      <Box sx={{ display: "flex", justifyContent: "center", mt: 3 }}>
        <Button 
          variant="contained" 
          color="error" 
          sx={{borderRadius: 3 }}
          onClick={() => setLeaveDialogOpen(true)}
        >
          Leave Mentorship Program
        </Button>
      </Box>

      {/* Leave Program Dialog */}
      <Dialog
        open={leaveDialogOpen}
        onClose={() => setLeaveDialogOpen(false)}
        maxWidth="xs"
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle>
          Confirm Leaving
          <IconButton
            aria-label="close"
            onClick={() => setLeaveDialogOpen(false)}
            sx={{ position: "absolute", right: 10, top: 10 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Typography>
            Are you sure you want to leave the mentorship program? This action cannot be undone.
          </Typography>
        </DialogContent>
        <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2, p: 2 }}>
          <Button onClick={() => setLeaveDialogOpen(false)} variant="outlined">
            Cancel
          </Button>
          <Button
            onClick={async () => {
              setLeaveDialogOpen(false);
              await handleLeaveProgram();
            }}
            color="error"
            variant="contained"
          >
            Leave
          </Button>
        </Box>
      </Dialog>

      {/* Edit Profile Dialog */}
      <Dialog
        open={editOpen}
        onClose={handleEditClose}
        maxWidth={false}
        PaperProps={{
          sx: { width: 900, maxWidth: "95vw" }
        }}
      >
        <DialogTitle>
          Edit Profile
          <IconButton
            aria-label="close"
            onClick={handleEditClose}
            sx={{ position: "absolute", right: 10, top: 10 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ p: 2, pt: 3 }}>
          <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 5 }}>
            {steps.map((label,index) => (
              <Step key={label}>
                <StepLabel
                  onClick={() => setActiveStep(index)}
                  sx={{ 
                    cursor: "pointer", 
                    pointerEvents: "auto", "&:hover": {cursor: "pointer"} 
                  }}
                  role="button"
                  tabIndex={0}
                >{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
          {getStepContent(activeStep)}
        </DialogContent>
      </Dialog>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert onClose={() => setSnackbarOpen(false)} severity={snackbarSeverity} sx={{ width: "100%" }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Paper>
  );
};

export default ProfileTab;