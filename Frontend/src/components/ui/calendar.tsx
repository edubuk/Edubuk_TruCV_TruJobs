import * as React from "react";
//import { DemoContainer } from "@mui/x-date-pickers/internals/demo";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import dayjs from "dayjs";
//import { twMerge } from "tailwind-merge";

interface Props {
  value: any;
  setValue: React.Dispatch<React.SetStateAction<any>>;
  defaultDate: any;
  isDateFrom?: boolean;
  isCurrentlyWorking?: boolean;
  index: number;
}

export default function ReferenceDateUsingValue({
  value,
  setValue,
  // defaultDate,
  isCurrentlyWorking,
  isDateFrom = false,
  index,
}: Props) {
  console.log("value to date", value);
  const storedFormData = localStorage.getItem("step3CvData");
  let Experience;
  if (storedFormData) {
    const parsedData = JSON.parse(storedFormData);
    const { Experience: ex } = parsedData;
    Experience = ex;
  }

  // Determine the initial default date as a dayjs object
  const initialDefaultDate =
    dayjs(
      isDateFrom
        ? Experience?.[index]?.duration?.from
        : Experience?.[index]?.duration?.to
    ) || dayjs("2022-04-17"); // Fallback to a specific date if undefined

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <DatePicker
        disabled={!isDateFrom && isCurrentlyWorking}
        value={value}
        onChange={setValue}
        maxDate={dayjs()}
        defaultValue={initialDefaultDate}
        views={["year", "month", "day"]}
        className="w-[130px] sm:w-full"
      />
    </LocalizationProvider>
  );
}
