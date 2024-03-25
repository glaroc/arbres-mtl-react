import { useEffect, useState, useRef, useCallback } from "react";
import {
  Grid,
  Card,
  CardContent,
  Box,
  Select,
  OutlinedInput,
  Chip,
  Typography,
  MenuItem,
  FilledInput,
  InputLabel,
  Input,
  TextField,
} from "@mui/material";

export default function TreeBar2(props: any) {
  const { data, treeColors } = props;
  const [bars, setBars] = useState([]);

  useEffect(() => {
    let w = 0;
    const allBars: any = data.map((d: any) => {
      w = w == 0 ? d.count : w;
      return (
        <Grid container sx={{ marginBottom: "5px" }}>
          <Grid item xs={12}>
            <Typography sx={{ fontSize: 16 }}>{d.essence_fr}</Typography>
          </Grid>
          <Grid item xs={10}>
            <Grid container>
              <Grid
                item
                xs={(11 * d.count) / w}
                sx={{ background: treeColors[d.essence_latin], height: "15px" }}
              ></Grid>
              <Grid item xs={12 - (11 * d.count) / w} sx={{ height: "15px" }}>
                <Typography sx={{ fontSize: 11, paddingLeft: "3px" }}>
                  {d.count}
                </Typography>
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      );
    });
    setBars(allBars);
  }, [data]);
  return <>{bars}</>;
}
