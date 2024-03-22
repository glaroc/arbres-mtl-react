import { styled } from "@mui/material/styles";
import MenuItem from "@mui/material/MenuItem";
import { Autocomplete, Button, Paper } from "@mui/material";

export const CustomButton = styled(Button)(({ theme }) => ({
  color: theme.palette.primary.contrastText,
  border: `1px solid ${theme.palette.primary.contrastText}`,
  padding: "4px 0px",
}));

export const CustomButtonCABO = styled(Button)(({ theme }) => ({
  color: theme.palette.primary.light,
  border: `1px solid ${theme.palette.primary.contrastText}`,
  background: theme.palette.primary.main,
  ":hover": {
    background: theme.palette.primary.main,
    color: "yellow",
    fontWeight: 800,
  },
}));

export const CustomAutocomplete = styled(Autocomplete)(({ theme }) => ({
  "label + &": {
    marginTop: theme.spacing(3),
    color: theme.palette.primary.light,
  },
  "& .MuiInputBase-input": {
    color: theme.palette.primary.main,
    fontSize: 16,
  },
  "& .MuiMenu": {
    color: theme.palette.primary.main,
    backgroundColor: theme.palette.primary.light,
  },
  "& .MuiInputPopper-root": {
    color: theme.palette.primary.main,
    backgroundColor: theme.palette.primary.light,
  },
}));

export const CustomPaper = styled(Paper)(({ theme }) => ({
  //background: theme.palette.primary.light,
  color: theme.palette.primary.main,
}));
