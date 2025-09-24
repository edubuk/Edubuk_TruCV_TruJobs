import * as React from "react";
//import { DemoContainer } from "@mui/x-date-pickers/internals/demo";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import dayjs from "dayjs";

interface Props {
  value: any;
  setValue: React.Dispatch<React.SetStateAction<any>>;
  isDateFrom?: boolean;
  index: number;
}

export default function ProjectCalendar({
  value,
  setValue,
  // defaultDate,
  isDateFrom = false,
  index,
}: Props) {
  const storedFormData = localStorage.getItem("step5CvData");
  let Projects;
  if (storedFormData) {
    const parsedData = JSON.parse(storedFormData);
    const { Projects: pr } = parsedData;
    Projects = pr;
  }

  // Determine the initial default date as a dayjs object
  const initialDefaultDate =
    dayjs(
      isDateFrom
        ? Projects?.[index]?.duration?.from
        : Projects?.[index]?.duration?.to
    ) || dayjs("2022-04-17"); // Fallback to a specific date if undefined

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <DatePicker
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
