import { Box, Typography, Link, Container, Grid } from "@mui/material";
import SIH2 from "../images/SIH2.jpg";

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
          <Grid item xs={12} md="auto" display="flex" alignItems="center">
            <img src={SIH2} alt="SIH Logo" style={{ width: 60, height: 60, marginRight: 10 }} />
            <Typography variant="body1" fontWeight="bold">
              Alumni Data Interface
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