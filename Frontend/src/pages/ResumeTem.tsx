import React, { useRef, useState } from "react";
import {
  FaPhoneAlt,
  FaEnvelope,
  FaLinkedin,
  FaGithub,
  FaDownload,
  FaCopy,
} from "react-icons/fa";
import { useGetCv } from "@/api/cv.apis";
import { Link, useParams } from "react-router-dom";
import ThreeDotLoader from "@/components/Loader/ThreeDotLoader";
import { PDFDownloadLink } from "@react-pdf/renderer";
import { CVDocument } from "@/components/PDFDownloader/ReactPDF";
// import { SiHyperskill } from "react-icons/si";
// import { FaBriefcase } from "react-icons/fa";
// import { GiAchievement } from "react-icons/gi";
// import { BiSolidBriefcase } from "react-icons/bi";
// import { GraduationCap, Mail, MapPinned, Phone } from "lucide-react";
// import { MdSchool } from "react-icons/md";
// import HyperText from "@/components/ui/AnimateHypertext";
// import ShowVerifications from "@/components/ShowVerifications";
// import { ShowAnimatedVerifications } from "@/components/ShowAnimatedVerifications";
import { useUserData } from "@/context/AuthContext";

import toast from "react-hot-toast";
//import PdfDownloader from "@/components/PDFDownloader/PdfDownloader";

const Resume: React.FC = () => {
  const { id } = useParams();
  const [copied, setCopied] = useState(false);
  const pdfRef = useRef<HTMLDivElement>(null);
  const { subscriptionPlan } = useUserData();
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    console.log("date", dateString);
    const formatedDate = date.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
    console.log("formated date", formatedDate);
    if (formatedDate == "Invalid Date" || formatedDate == "1 Jan 1970") {
      return "Present";
    }
    return formatedDate;
  };

  const { cvData, isLoading } = useGetCv(id!);
  console.log(cvData);
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[80vh]">
        <h1 className="text-4xl font-bold text-[#03257e]">
          <ThreeDotLoader w={4} h={4} yPos={"center"} />
        </h1>
      </div>
    );
  }

  if (!cvData) {
    return (
      <div className="flex justify-center items-center">
        <h1 className="text-4xl font-bold text-[#006666]">No CV Found</h1>
      </div>
    );
  }

  // const downloadPdfHandler = async()=>{
  //   try {
  //     setLoading(true);
  //     const response = await fetch(`http://localhost:8000/cv/pdfmaker`,{
  //       method:"POST",
  //       headers:{
  //         "Content-Type":"application/json",
  //         "Authorization": `Bearer ${localStorage.getItem("googleIdToken")}`
  //       },
  //       body:JSON.stringify({url:`http://:5173/new-cv/${id}`,selector:"#cv-preview-wrapper",loginMailId:localStorage.getItem("email")})
  //     })
  //     if(!response.ok){
  //       throw new Error("Failed to generate PDF");
  //     }
  //     const blob = await response.blob();
  //     const url = URL.createObjectURL(blob);
  //     const link = document.createElement("a");
  //     link.href = url;
  //     link.download = `${cvData.personalDetails.name}.pdf`;
  //     link.click();
  //     URL.revokeObjectURL(url);
  //     toast.success("PDF downloaded successfully");
  //   } catch (error) {
  //     console.log(error);
  //     toast.error("Failed to download PDF");
  //   }finally{
  //     setLoading(false);
  //   }
  // }

  const copyResumeLink = async (link: string) => {
    await navigator.clipboard
      .writeText(link)
      .then(() => setCopied(true))
      .catch((err) => {
        toast.error("something went wrong", err.message);
      });
    //console.log("Link copied to clipboard");
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end p-4 gap-2">
        <div
          className="flex items-center gap-2 border-2 border-[#03257e] px-2 py-1 rounded cursor-pointer text-[#03257e] hover:text-[#006666]"
          onClick={() =>
            copyResumeLink(`https://educhain-tru-cv.vercel.app/new-cv/${id}`)
          }
        >
          <FaCopy />
          <span className="font-medium">
            {copied ? "Copied" : "Copy Template Link"}
          </span>
        </div>
        {
          subscriptionPlan !== "Free" ? (
            <Link
              to="/subscription"
              className="rounded flex items-center justify-center text-white bg-gradient-to-r from-[#03257e] via-[#006666] to-[#f14419] px-4 py-2 hover:opacity-90"
            >
              Upgrade to Pro to Download
            </Link>
          ) : (
            <PDFDownloadLink
              document={<CVDocument cvData={cvData} id={id} />}
              fileName={`${cvData.personalDetails.name}.pdf`}
            >
              {({ loading }) =>
                loading ? (
                  "Preparing document..."
                ) : (
                  <button className="flex items-center bg-[#006666] text-white px-4 py-2 rounded">
                    <FaDownload className="mr-2" />
                    Download as PDF
                  </button>
                )
              }
            </PDFDownloadLink>
          )
          // :<button onClick={downloadPdfHandler} className="bg-[#006666] flex items-center text-white px-4 py-2 rounded" disabled={loading}>{loading ? "Generating PDF..." :<span className="flex items-center"><FaDownload className="mr-2"/> Download as PDF</span>}</button>
        }
      </div>
      <div
        ref={pdfRef}
        className="font-family min-h-screen flex justify-center px-4 py-3 overflow-hidden w-full"
      >
        <div
          id="cv-preview-wrapper"
          className="max-w-6xl mx-auto bg-white w-[1100px] shadow-xl rounded-lg px-6 py-3 overflow-x-scroll"
        >
          <header className="pb-4 mb-4 text-center">
            <h1 className="text-4xl font-semibold text-[#000000]">
              {cvData.personalDetails.name}
            </h1>

            <div className="text-gray-600 mt-4 flex flex-col sm:flex-row sm:justify-center sm:flex-wrap gap-2">
              {/* Phone */}
              <div className="flex items-center space-x-2 px-2 leading-[1.25] align-middle">
                <span className="inline-flex items-center align-middle">
                  <FaPhoneAlt className="text-sm text-[#000000]" />
                </span>
                <span className="text-gray-800 hover:text-[#000000] font-semibold inline-flex items-center align-middle">
                  {cvData.personalDetails.phoneNumber}
                </span>
              </div>

              {/* Email */}
              <div className="flex items-center space-x-2 px-2 leading-[1.25] align-middle">
                <span className="inline-flex items-center align-middle">
                  <FaEnvelope className="text-sm text-[#000000]" />
                </span>
                <a
                  href={`mailto:${cvData.personalDetails.email}`}
                  className="text-gray-800 hover:text-[#000000] font-semibold inline-flex items-center align-middle"
                >
                  {cvData.personalDetails.email}
                </a>
              </div>

              {/* LinkedIn */}
              <div className="flex items-center space-x-2 px-2 leading-[1.25] align-middle">
                <span className="inline-flex items-center align-middle">
                  <FaLinkedin className="text-sm text-[#000000]" />
                </span>
                <a
                  href={cvData?.personalDetails?.linkedinProfile}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-800 hover:text-[#000000] font-semibold inline-flex items-center align-middle"
                >
                  LinkedIn
                </a>
              </div>

              {/* GitHub */}
              <div className="flex items-center space-x-2 px-2 leading-[1.25] align-middle">
                <span className="inline-flex items-center align-middle">
                  <FaGithub className="text-sm text-[#000000]" />
                </span>
                <a
                  href={cvData?.personalDetails?.githubProfile}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-black hover:text-[#000000] font-semibold inline-flex items-center align-middle"
                >
                  GitHub
                </a>
              </div>
            </div>
          </header>

          {/* Education Section */}
          <section className="mb-4">
            <h2 className="text-xl font-semibold text-[#000000] border-b border-black pb-2">
              Education
            </h2>
            <div className="mt-2 space-y-1">
              {cvData.education.postGraduateCollege &&
                cvData.education.postGraduateDegree &&
                cvData.education.postGraduateGPA && (
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-semibold text-[#000000] ">
                        {cvData.education.postGraduateCollege}
                      </h3>
                      <i className="text-[#000000] font-serif">
                        {cvData.education.postGraduateDegree}
                      </i>
                    </div>
                    <div className="text-right">
                      <p className="text-[#000000] font-serif">
                        {cvData.education.postGraduateDuration?.duration.from} -{" "}
                        {cvData.education.postGraduateDuration?.duration.to}
                      </p>
                      <p className="text-[#000000] font-semibold font-serif">
                        GPA: {JSON.stringify(cvData.education.postGraduateGPA)}
                        /10
                      </p>
                    </div>
                  </div>
                )}
              {cvData.education.underGraduateCollege &&
                cvData.education.underGraduateDegree &&
                cvData.education.underGraduateGPA && (
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-semibold text-gray-900 ">
                        {cvData.education.underGraduateCollege}
                      </h3>
                      <i className="text-gray-600 font-serif">
                        {cvData.education.underGraduateDegree}
                      </i>
                    </div>
                    <div className="text-right">
                      <p className="text-[#000000] font-serif">
                        {
                          cvData?.education?.underGraduateDuration?.duration
                            ?.from
                        }{" "}
                        -{" "}
                        {cvData?.education?.underGraduateDuration?.duration?.to}
                      </p>
                      <p className="text-[#000000] font-semibold font-serif">
                        GPA: {JSON.stringify(cvData.education.underGraduateGPA)}
                        /10
                      </p>
                    </div>
                  </div>
                )}
              {cvData.education.class12College &&
                cvData.education.class12Board &&
                cvData.education.class12Grade && (
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-semibold text-gray-900 ">
                        {cvData.education.class12College}
                      </h3>
                      <i className="text-gray-600 font-serif">
                        Class-XII | {cvData.education.class12Board}
                      </i>
                    </div>
                    <div className="text-right">
                      <p className="text-[#000000] font-semibold font-serif">
                        {JSON.stringify(cvData.education.class12Grade)}
                      </p>
                    </div>
                  </div>
                )}
              {cvData.education.class10School &&
                cvData.education.class10Board &&
                cvData.education.class10Grade && (
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-semibold text-gray-900 ">
                        {cvData.education.class10School}
                      </h3>
                      <i className="text-gray-600 font-serif">
                        Class-X | {cvData.education.class10Board}
                      </i>
                    </div>
                    <div className="text-right">
                      <p className="text-[#000000] font-semibold font-serif">
                        {JSON.stringify(cvData.education.class10Grade)}
                      </p>
                    </div>
                  </div>
                )}
            </div>
          </section>

          {/* Technical Skills */}
          <section className="mb-4">
            <h2 className="text-xl font-semibold text-[#000000] border-b border-black pb-2">
              Skills
            </h2>
            <div className="flex flex-wrap gap-2 mt-2">
              {cvData?.skills?.length > 0 &&
                cvData.skills.map((skill, i) => (
                  <span
                    key={i}
                    className="px-3 py-1 text-center text-sm font-semibold text-[#000000] rounded-full bg-gray-100"
                  >
                    {skill.skillName}
                  </span>
                ))}
            </div>
          </section>

          {/* Experience Section */}
          {cvData?.experience?.length > 0 && (
            <section className="mb-4">
              <h2 className="text-xl font-semibold text-[#000000] border-b border-black pb-2">
                Experience
              </h2>
              {cvData.experience.map((exp, index) => (
                <div className="mt-2" key={index}>
                  <div className="flex justify-between items-center">
                    <div className="flex justify-center flex-col items-start gap-1">
                      <h3 className="font-bold text-[#000000]">
                        {exp.company_name}
                      </h3>
                      <i>{exp.job_role}</i>
                    </div>
                    <p className="text-[#000000] text-right">
                      {formatDate(exp.duration.from)} -{" "}
                      {formatDate(exp.duration.to)}{" "}
                    </p>
                  </div>
                  <ul className="list-disc list-inside text-[#000000] mt-2 pl-6">
                    {exp.description !== "" &&
                      exp.description
                        .split(".")
                        .filter((point) => point.trim() !== "")
                        .map((point, i) => (
                          <li key={i}>
                            {point.endsWith(".") ? point : `${point}.`}
                          </li>
                        ))}
                  </ul>
                </div>
              ))}
            </section>
          )}

          {/* Projects Section */}
          {cvData.achievements.projects.length > 0 && (
            <section className="mb-4">
              <h2 className="text-xl font-semibold text-[#000000] border-b border-black pb-2">
                Projects
              </h2>
              {cvData.achievements.projects.map((project, i) => (
                <div key={i} className="mt-2 space-y-4">
                  <div>
                    <div className="flex justify-between items-center">
                      <h3 className="font-bold text-[#000000]">
                        {project.project_name}
                      </h3>
                      <p className="text-[#000000] text-right">
                        {formatDate(project.duration.from)} -{" "}
                        {project.duration.to}
                      </p>
                    </div>
                    <ul className="list-disc list-inside text-[#000000] mt-2 pl-6">
                      {project.description
                        .split(".")
                        .filter((point) => point.trim() !== "")
                        .map((point, i) => (
                          <li key={i}>
                            {point.endsWith(".") ? point : `${point}.`}
                          </li>
                        ))}
                    </ul>
                  </div>
                </div>
              ))}
            </section>
          )}
          {/* Courses Section */}
          {cvData.achievements.courses?.length > 0 && (
            <section className="mb-4">
              <h2 className="text-xl font-semibold text-[#000000] border-b border-black pb-2">
                Courses
              </h2>
              {cvData.achievements.courses.map((course, i) => (
                <div key={i} className="mt-2 space-y-6">
                  <div>
                    <div className="flex justify-between items-center">
                      <h3 className="font-bold text-[#000000]">
                        {course.course_name} |{" "}
                        <i className="text-[#000000]">{course.organization}</i>
                      </h3>
                      <p className="text-[#000000] text-right">
                        {formatDate(course.duration.from)} -{" "}
                        {formatDate(course.duration.to)}
                      </p>
                    </div>
                    <ul className="list-disc list-inside text-[#000000] mt-2  pl-6">
                      {course.description
                        .split(".")
                        .filter((point) => point.trim() !== "")
                        .map((point, i) => (
                          <li key={i}>
                            {point.endsWith(".") ? point : `${point}.`}
                          </li>
                        ))}
                    </ul>
                  </div>
                </div>
              ))}
            </section>
          )}
          {/* Award Section */}
          {cvData.achievements.awards.length > 0 && (
            <section className="mb-4">
              <h2 className="text-xl font-semibold text-[#000000] border-b border-black pb-2">
                Award & Achievements
              </h2>
              {cvData.achievements.awards.map((award, i) => (
                <div key={i} className="mt-2 space-y-6">
                  <div>
                    <div className="flex justify-between items-center">
                      <h3 className="font-bold text-[#000000]">
                        {award.award_name} |{" "}
                        <i className="text-[#000000]">
                          {award.awarding_organization}
                        </i>
                      </h3>
                      <p className="text-[#000000] text-right">
                        {formatDate(award.date_of_achievement)}
                      </p>
                    </div>
                    <ul className="list-disc list-inside text-[#000000] mt-2 space-y-2 pl-6">
                      {award.description
                        .split(".")
                        .filter((point) => point.trim() !== "")
                        .map((point, i) => (
                          <li key={i}>
                            {point.endsWith(".") ? point : `${point}.`}
                          </li>
                        ))}
                    </ul>
                  </div>
                </div>
              ))}
            </section>
          )}
        </div>
      </div>
    </div>
  );
};

export default Resume;
