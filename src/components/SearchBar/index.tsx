import { useEffect, useState } from "react";
import {
  TextField,
  Autocomplete,
  FilledInput,
  Tabs,
  Tab,
  Select,
  MenuItem,
  FormControl,
  Button,
  ButtonGroup,
  Chip,
  Avatar,
  Typography,
  Container,
  Modal,
} from "@mui/material";
import {
  CustomButton,
  CustomAutocomplete,
  CustomPaper,
} from "../../styles/customMUI";
import Search from "@mui/icons-material/Search";
import { t, lang } from "../../helpers/translations";
import theme from "../../styles/theme";

export default function SearchBar(props: any) {
  const {
    searchBarValue,
    setSearchBarValue,
    searchButtonClicked,
    totalSpeciesCount,
    treeColors,
  } = props;
  const [options, setOptions] = useState([]);

  useEffect(() => {
    if (totalSpeciesCount) {
      let names = totalSpeciesCount.filter(
        (value: any, index: number, self: any) =>
          index ===
          self.findIndex(
            (t: any) =>
              t.essence_fr === value.essence_fr &&
              t.essence_fr === value.essence_fr
          )
      );
      names = names
        .sort((a: any, b: any) => {
          if (a.essence_fr < b.essence_fr) {
            return -1;
          }
          if (a.essence_fr > b.essence_fr) {
            return 1;
          }
          return 0;
        })
        .map((r: any) => ({
          label: r.essence_fr,
          id: r.essence_latin,
        }));
      setOptions(names);
    }
  }, [totalSpeciesCount]);

  return (
    <ButtonGroup>
      <CustomAutocomplete
        multiple
        id="size-small-filled-multi"
        size="small"
        options={options}
        getOptionLabel={(option: any) => option.label}
        sx={{ width: "275px" }}
        value={searchBarValue}
        PaperComponent={CustomPaper}
        onChange={(e, value) => setSearchBarValue(value)}
        renderTags={(value, getTagProps) =>
          value.map((option: any, index) => (
            <Chip
              variant="outlined"
              label={option.label}
              size="small"
              sx={{
                color: "white",
              }}
              /*avatar={
                <Avatar
                  sx={{
                    backgroundColor: "white",
                    padding: "0px 4px",
                    fontWeight: "bold",
                  }}
                >
                  {spFreq[option.label] ? spFreq[option.label] : 0}
                </Avatar>
              }*/
              {...getTagProps({ index })}
            />
          ))
        }
        renderInput={(params) => (
          <TextField
            {...params}
            variant="outlined"
            label={t("search_by_species")}
            placeholder={
              searchBarValue.length === 0 ? t("enter_species_name") : ""
            }
          />
        )}
      />
      <CustomButton onClick={searchButtonClicked}>
        <Search></Search>
      </CustomButton>
    </ButtonGroup>
  );
}
