import { Box, Typography, Link, Container, Grid } from "@mui/material";


const Footer = () => {
  return (
    <Box
      component="footer"
      sx={{
        color: "white",
        py: 2,
        background: "linear-gradient(to right, #4a00e0, #8e2de2)",
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={2} justifyContent="space-between" alignItems="center">
          {/* PSG Tech logo and label */}
          <Grid item xs={12} md="auto" display="flex" alignItems="center">
            <img src="/SIH.jpg" alt="SIH Logo" style={{ width: 60, height: 60, marginRight: 10 }} />
            <Typography variant="body1" fontWeight="bold">
              The Alumni Association
            </Typography>
          </Grid>

          {/* Developer Info link aligned right */}
          <Grid item xs={12} md="auto">
        
          <Typography variant="body1" fontWeight="bold">
            <Link href="/developers-info" underline="hover" color="white">
              Developer Info
            </Link>
          </Typography>
        
        </Grid>
        
        </Grid>
      </Container>
    </Box>
  );
};

export default Footer;