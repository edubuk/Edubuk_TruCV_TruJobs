import * as React from "react";
//import { DemoContainer } from "@mui/x-date-pickers/internals/demo";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import dayjs from "dayjs";

interface Props2 {
  value: any;
  setValue: React.Dispatch<React.SetStateAction<any>>;
  isDateFrom?: boolean;
}

export default function PostGraduateCal({
  value,
  setValue,
  // defaultDate,
  isDateFrom = false,
}: Props2) {
  const storedFormData = localStorage.getItem("step2CvData");
  let postGraduateDuration;
  if (storedFormData) {
    const parsedData = JSON.parse(storedFormData);
    const { postGraduateDuration: pr } = parsedData;
    postGraduateDuration = pr;
  }

  // Determine the initial default date as a dayjs object
  const initialDefaultDate2 =
    dayjs(
      isDateFrom
        ? postGraduateDuration?.duration?.from
        : postGraduateDuration?.duration?.to
    ) || dayjs("2022-04-17"); // Fallback to a specific date if undefined

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <DatePicker
        value={value}
        onChange={setValue}
        {...(isDateFrom && { maxDate: dayjs() })}
        defaultValue={initialDefaultDate2}
        views={["year", "month", "day"]}
        className="w-[130px] sm:w-full"
      />
    </LocalizationProvider>
  );
}
