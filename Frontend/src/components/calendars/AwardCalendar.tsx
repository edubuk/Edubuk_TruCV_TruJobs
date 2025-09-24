import * as React from "react";
//import { DemoContainer } from "@mui/x-date-pickers/internals/demo";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import dayjs from "dayjs";

interface Props {
  value: any;
  setValue: React.Dispatch<React.SetStateAction<any>>;
  // defaultDate: any;
  index: number;
}

export default function AwardCalendar({
  value,
  setValue,
}: // defaultDate,
// index,
Props) {
  // const storedFormData = localStorage.getItem("step5CvData");
  // let Awards;
  // if (storedFormData) {
  //   const parsedData = JSON.parse(storedFormData);
  //   const { Awards: aw } = parsedData;
  //   Awards = aw;
  // }

  // console.log(Awards);

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <DatePicker
        value={value}
        onChange={setValue}
        maxDate={dayjs()}
        // defaultValue={initialDefaultDate}
        views={["year", "month", "day"]}
        className="w-[130px] sm:w-full"
      />
    </LocalizationProvider>
  );
}
