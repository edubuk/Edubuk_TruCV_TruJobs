import { Request, Response } from "express";
import axios from "axios";
import User,{ IUser } from "../models/userCV.model";
//import * as cheerio from "cheerio";

import {
  AwardObjectType,
  CourseObjectType,
  CV,
  ExperienceObjectType,
  ProjectObjectType,
} from "../models/cv.model";
import {
  AwardVerificationType,
  CourseVerificationType,
  EducationVerificationsType,
  ExperienceVerificationsType,
  PersonalVerificationsType,
  ProfileSummaryVerificationType,
  ProjectVerificationType,
  SkillsVerificationType,
} from "../types/verifications.types";
// Define the type for education object
type EducationType = {
  class10School?: string;
  class10Board?: string;
  class10Grade?: string;
  class10CertUrl?:string,
  class12College?: string;
  class12Board?: string;
  class12Grade?: string;
  class12CertUrl?:string;
  underGraduateCollege?: string;
  underGraduateDegree?: string;
  underGraduateGPA?: string;
  underGraduateDuration?:string;
  underGraduateCertUrl?:string,
  postGraduateCollege?: string;
  postGraduateDegree?: string;
  postGraduateGPA?: string;
  postGraduateDuration?:string;
  postGraduateCertUrl?:string,

};

// Define the type for personal details object
type PersonalDetailsType = {
  name: string;
  email: string;
  location: string;
  profession: string;
  imageUrl: string;
  phoneNumber: string;
  linkedinProfile?:string;
  twitterProfile?:string;
  telegramProfile?:string;
  instagramProfile?:string;
  githubProfile?:string;
  years_of_experience: string;
};

type AchievementsObjectType = {
  awards?: AwardObjectType[] | [];
  courses?: CourseObjectType[] | [];
  projects?: ProjectObjectType[] | [];
};
type SkillObjectType = {
  skillName: string;
  skillUrl?:string,
};

// Main data type with personal details and education
type DataToBeStoredType = {
  nanoId: string;
  personalDetails: PersonalDetailsType;
  education: EducationType;
  experience: ExperienceObjectType[] | [];
  skills: SkillObjectType[] | [];
  achievements?: AchievementsObjectType;
  profile_summary: string;
  // verifications;
  // verifications;
  personalDetailsVerification?: PersonalVerificationsType;
  educationVerifications?: EducationVerificationsType;
  experienceVerifications?: ExperienceVerificationsType;
  skillsVerifications?: SkillsVerificationType;
  awardVerifications?: AwardVerificationType;
  courseVerifications?: CourseVerificationType;
  projectsVerifications?: ProjectVerificationType;
  profileSummaryVerification?: ProfileSummaryVerificationType;
};

// requestbody type;
interface RequestBodyType {
  loginMailId:string,
  nanoId: string;
  name: string;
  email: string;
  location: string;
  profession: string;
  imageUrl: string;
  phoneNumber: string;
  linkedinProfile?:string;
  twitterProfile?:string;
  telegramProfile?:string;
  instagramProfile?:string;
  githubProfile?:string;
  Years_of_experience: string;
  profile_summary: string;
  class10SchoolName: string;
  class10Board: string;
  class10Grade: string;
  class10CertUrl?:string,
  class12CollegeName?: string;
  class12Board?: string;
  class12Grade?: string;
  class12CertUrl?:string,
  underGraduateCollegeName?: string;
  underGraduateDegreeName?: string;
  underGraduateGPA?: string;
  underGraduateDuration?:string;
  underGraduateCertUrl?:string,
  postGraduateCollegeName?: string;
  postGraduateDegreeName?: string;
  postGraduateGPA?: string;
  postGraduateDuration?:string;
  postGraduateCertUrl?:string,
  Experience: ExperienceObjectType[] | []; // Experience is an array of objects
  Skills: SkillObjectType[];
  Awards: AwardObjectType[] | [];
  Courses: CourseObjectType[] | [];
  Projects: ProjectObjectType[] | [];
  // verifications;
  personalDetailsVerification: PersonalVerificationsType;
  educationVerifications: EducationVerificationsType;
  experienceVerifications: ExperienceVerificationsType;
  skillsVerifications: SkillsVerificationType;
  awardVerifications: AwardVerificationType;
  courseVerifications: CourseVerificationType;
  projectsVerifications: ProjectVerificationType;
  profileSummaryVerification: ProfileSummaryVerificationType;
}

export const createCv = async (req: Request, res: Response) => {
  console.log("req",req.body)
  try {
    const {
      loginMailId,
      nanoId,
      name,
      email,
      location,
      profession,
      imageUrl,
      phoneNumber,
      linkedinProfile,
      twitterProfile,
      telegramProfile,
      instagramProfile,
      githubProfile,
      Years_of_experience,
      profile_summary,
      class10SchoolName,
      class10Board,
      class10Grade,
      class10CertUrl,
      class12CollegeName,
      class12Board,
      class12Grade,
      class12CertUrl,
      underGraduateCollegeName,
      underGraduateDegreeName,
      underGraduateGPA,
      underGraduateCertUrl,
      underGraduateDuration,
      postGraduateCollegeName,
      postGraduateDegreeName,
      postGraduateCertUrl,
      postGraduateGPA,
      postGraduateDuration,
      Experience,
      Skills,
      Awards,
      Courses,
      Projects,
      //verifications
      personalDetailsVerification,
      educationVerifications,
      experienceVerifications,
      skillsVerifications,
      awardVerifications,
      courseVerifications,
      projectsVerifications,
      profileSummaryVerification,
    } = req.body as RequestBodyType;
    console.log("req body",req.body);
    //console.log("undergraduate duration",underGraduateDuration)
    if (
      !loginMailId ||
      !nanoId ||
      !name ||
      !email ||
      !location ||
      !profession ||
      !imageUrl ||
      !phoneNumber ||
      !profile_summary
    ) {
      return res
        .status(400)
        .json(
          "All fields like {name,email,location,profession,imageUrl,phoneNumber,years_of_experience,profile_summary} are required"
        );
    }

    let dataToBeStored: DataToBeStoredType = {
      nanoId,
      personalDetails: {
        name,
        email,
        location,
        profession,
        imageUrl,
        phoneNumber,
        linkedinProfile,
        twitterProfile,
        telegramProfile,
        instagramProfile,
        githubProfile,
        years_of_experience: Years_of_experience,
      },
      education: {},
      experience: [],
      skills: Skills,
      profile_summary,
      // verifications;
      personalDetailsVerification,
      educationVerifications,
      experienceVerifications,
      skillsVerifications,
      awardVerifications,
      courseVerifications,
      projectsVerifications,
      profileSummaryVerification,
    };

    const addEducationFields = (
      field: keyof EducationType,
      value: string | undefined
    ) => {
      if (value) {
        dataToBeStored.education[field] = value;
      }
    };
    // const addCourseFields = (
    //   field: keyof EducationType,
    //   value: string | undefined
    // ) => {
    //   if (value) {
    //     dataToBeStored.education[field] = value;
    //   }
    // };
    // const addPFields = (
    //   field: keyof EducationType,
    //   value: string | undefined
    // ) => {
    //   if (value) {
    //     dataToBeStored.education[field] = value;
    //   }
    // };

    // class10fields;
    addEducationFields("class10School", class10SchoolName);
    addEducationFields("class10Board", class10Board);
    addEducationFields("class10Grade", class10Grade);
    addEducationFields("class10CertUrl", class10CertUrl);

    // class12fields;
    addEducationFields("class12College", class12CollegeName);
    addEducationFields("class12Board", class12Board);
    addEducationFields("class12Grade", class12Grade);
    addEducationFields("class12CertUrl", class12CertUrl);
    // undergraduate fields;
    addEducationFields("underGraduateCollege", underGraduateCollegeName);
    addEducationFields("underGraduateDegree", underGraduateDegreeName);
    addEducationFields("underGraduateGPA", underGraduateGPA);
    addEducationFields("underGraduateDuration", underGraduateDuration);
    addEducationFields("underGraduateCertUrl", underGraduateCertUrl);
    // postGraduate fields;
    addEducationFields("postGraduateCollege", postGraduateCollegeName);
    addEducationFields("postGraduateDegree", postGraduateDegreeName);
    addEducationFields("postGraduateGPA", postGraduateGPA);
    addEducationFields("postGraduateDuration", postGraduateDuration);
    addEducationFields("postGraduateCertUrl", postGraduateCertUrl);
    

    if (Experience?.length > 0) {
      dataToBeStored.experience = Experience;
    }

    if (Skills?.length > 0) {
      dataToBeStored.skills = Skills;
    }

    if (Awards?.length > 0) {
      dataToBeStored.achievements = {
        awards: Awards,
      };
    }

    if (Courses?.length > 0) {
      dataToBeStored.achievements = {
        ...dataToBeStored.achievements,
        courses: Courses,
      };
    }

    if (Projects?.length > 0) {
      dataToBeStored.achievements = {
        ...dataToBeStored.achievements,
        projects: Projects,
      };
    }

    const cvData = await CV.create(dataToBeStored);
    if(cvData)
    {
    // await User.findOneAndUpdate(
    //   { email:loginMailId },
    //   { $push: { documentIds: cvData._id } },
    //   { new: true, upsert: true }
    // );
    //mapping of all cv nanoIds with user email
    //console.log("cvData",cvData);
    await User.findOneAndUpdate(
      {email:loginMailId},
      { $push: { nanoIds: cvData.nanoId } },
      { new: true, upsert: true }
    );
    }
    return res.json(cvData);
  } catch (error) {
    console.log("ERROR:IN CREATE-CV CONTROLLER", error);
    res.status(500).json({success:false,error:error,message:"ERROR:IN CREATE-CV CONTROLLER"});
  }
};

export const getAllCvIds= async(req:Request,res:Response)=>{
  try {
    console.log("req params",req.params);
    const {email} = req.params;
    // Find the user by email
    const user: IUser | null = await User.findOne({ email });
    console.log("user",user);
    if (!user) {
      console.log("User not found");
      return res.status(500).json({
        success:false,
        message:"No Cv Found"})

    }

    // Return the array of document IDs
    const Ids= user.nanoIds.map((id:string) => id.toString());

    //console.log("Ids",Ids);
    return res.status(200).json({success:true,userData:user});
    
  } catch (error) {
    console.log("ERROR:IN getAllCVIds", error);
    res.status(500).json({success:false,error:error,message:"ERROR:IN getAllCVIds"});
  }
}

export const getCv = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const cv = await CV.findById(id);
    if (!cv) {
      return res.status(404).json("No CV Found!");
    }

    return res.status(200).json(cv);
  } catch (error) {
    console.log("ERROR:GET_CV_CONTROLLER", error);
    res.status(500).json("ERROR:GET_CV_CONTROLLER");
  }
};

export const getCvByNanoId = async (req: Request, res: Response) => {
  try {
    const { nanoId } = req.params;
    console.log("nanoId",nanoId);
    const cv = await CV.findOne({ nanoId });
    if (!cv) {
      return res.status(404).json("No CV Found!");
    }
    //console.log("cv",cv);
    return res.status(200).json(cv);
  } catch (error) {
    console.log("ERROR:GET_CV_BY_NANO_ID_CONTROLLER", error);
    res.status(500).json({success:false,error:error,message:"ERROR:GET_CV_BY_NANO_ID_CONTROLLER"});
  }
};

// export const getAllCvIds= async(req:Request,res:Response)=>{
//   try {
//     const {email} = req.params;
//     // Find the user by email
//     const user: IUser | null = await User.findOne({ email }).select("documentIds");

//     if (!user) {
//       console.log("User not found");
//       return res.status(500).json({
//         success:false,
//         message:"No Cv Found"})

//     }

//     // Return the array of document IDs
//     const Ids= user.documentIds.map((id) => id.toString());
//     return res.status(200).json({success:true,Ids});
    
//   } catch (error) {
//     console.log("ERROR:IN getAllCVIds", error);
//     res.status(500).json("ERROR:IN getAllCVIds CONTROLLER");
//   }
// }

// export const getCv = async (req: Request, res: Response) => {
//   try {
//     const { id } = req.params;
//     const cv = await CV.findById(id);
//     if (!cv) {
//       return res.status(404).json("No CV Found!");
//     }

//     return res.status(200).json(cv);
//   } catch (error) {
//     console.log("ERROR:GET_CV_CONTROLLER", error);
//     res.status(500).json("ERROR:GET_CV_CONTROLLER");
//   }
// };

const statusType = {
  pending: "pending",
  approved: "approved",
  rejected: "rejected",
};

export const verifyDoc = async (req: Request, res: Response) => {
  try {
    const { pinataHash, field, subfield, nanoId } = req.params;
    const actualSubField = subfield.replace(/-/g, ' ');
    const approveDoc = async () => {
      const fieldPath = `${field}.${actualSubField}.mailStatus`;
      const updatedCv = await CV.findOneAndUpdate(
        { nanoId },
        { $set: { [fieldPath]: statusType.approved } },
        { new: true }
      );
      console.log("updatedCv",updatedCv);
      if (updatedCv===null) {
        window.alert("User has not submitted their CV");
        return res.status(404).json({ message: "CV not found!" });
        
      }

      console.log("Mail status updated");
      return updatedCv;
    };
    const rejectDoc = async () => {
      const fieldPath = `${field}.${actualSubField}.mailStatus`;
      const updatedCv = await CV.findOneAndUpdate(
        { nanoId },
        { $set: { [fieldPath]: statusType.rejected } },
        { new: true }
      );

      if (!updatedCv) {
        window.alert("User has not submitted their CV");
        return res.status(404).json({ message: "CV not found!" });
      }

      console.log("Mail status updated");
      return updatedCv;
    };

    // Check if this is an approval request
    if (req.method === "PUT" && req.body.action === "approve") {
      await approveDoc();
      return res.json({ message: "Mail status updated successfully!" });
    }
    if (req.method === "PUT" && req.body.action === "reject") {
      await rejectDoc();
      return res.json({ message: "Mail status updated successfully!" });
    }

    // Existing logic to display HTML content...
    const response = await axios.get(
      `${process.env.VITE_AzureGATWAY}/${pinataHash}`,
      { responseType: "arraybuffer" }
    );

    const contentType = response.headers["content-type"];

    if (contentType.includes("application/pdf")) {
      // If it's directly a PDF, embed it in HTML
      const base64Pdf = Buffer.from(response.data, "binary").toString("base64");

      const htmlContent = `
            <!DOCTYPE html>
            <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Edubuk</title>
                    <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
                    <style>

                        .container
                            {
                                display: flex;
                                flex-direction:column;
                                justify-content: center;
                                align-items: center;
                                text-align: center;
                                row-gap: 20px;
                                width: 100%;
                                height: auto;
                            }
                        h1 {
                                text-align: center;
                                align-items: center;
                                color: #006666;
                            }

                        .btn
                            {
                                display: flex;
                                justify-content: center;
                                align-items: center;
                                text-align: center;
                                gap: 20px;
                            }
                        button
                            {
                                padding: 15px 30px;
                                border: 1px solid #ccc;
                                border-radius: 8px;
                                font-size: 20px;
                                cursor:pointer;
                                margin:10px 0px;
                            }
                        button:hover
                        {
                        background-color:white;
                        border:1px solid #006666;
                        }
                        button:active
                        {
                        transform:translateY(2px);
                        }

                        iframe{
                        width:100%;
                        height:100vh;
                        border:none;
                        }

                        #approve
                            {
                                color:green
                            }
                        #reject
                            {
                                color:red
                            }
                    </style>
                </head>
                <body>
                    <div class='container'>
                      <h1>Verify Certificate</h1>
                        <div class='btn'>
                            <button id='approve'>Approve</button>
                            <button id='reject'>Reject</button>
                        </div>
                        <iframe src="data:application/pdf;base64,${base64Pdf}" ></iframe>
                    </div>
                </body>
                <script>
            document.getElementById('approve').addEventListener('click', async () => {
                try {
                    const response = await fetch(window.location.href, {
                        method: 'PUT', 
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ action: 'approve' }),
                    });
                    const result = await response.json();
                    if (response.ok) {
                      Swal.fire({
                      title: "Thank You!",
                      text: "Document approved",
                      icon: "success",
                      confirmButtonText: "OK",
                  }).then((result)=>{
                  if(result.isConfirmed)
                  {
                  window.location.href = "https://www.edubukeseal.com/";
                  }
                  });
                  } else {
                      const result = await response.json();
                      Swal.fire({
                          title: "Error",
                          text: result.message || "Something went wrong",
                          icon: "error",
                          confirmButtonText: "Retry",
                        });
                    }
                } catch (error) {
                    console.error('Error:', error);
                    alert('Failed to approve the document. Please retry...');
                }
            });
            document.getElementById('reject').addEventListener('click', async () => {
                try {
                    const response = await fetch(window.location.href, {
                        method: 'PUT', 
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ action: 'reject' }),
                    });
                    const result = await response.json();
                    if (response.ok) {
                      Swal.fire({
                      title: "Thank You!",
                      text: "Document successfully rejected",
                      icon: "success",
                      confirmButtonText: "OK",
                  }).then((result)=>{
                  if(result.isConfirmed)
                  {
                  window.location.href = "https://www.edubukeseal.com/";
                  }
                  });
                  } else {
                      const result = await response.json();
                      Swal.fire({
                          title: "Error",
                          text: result.message || "Something went wrong",
                          icon: "error",
                          confirmButtonText: "Retry",
                        });
                    }
                } catch (error) {
                    console.error('Error:', error);
                    alert('Failed to reject the document. Please retry...');
                }
            });
        </script>
            </html>
                `;
      res.setHeader("Content-Type", "text/html");
      res.send(htmlContent);
    } else if (
      contentType.includes("image/png") ||
      contentType.includes("image/jpeg") ||
      contentType.includes("image/jpg")
    ) {
      const base64Image = Buffer.from(response.data, "binary").toString(
        "base64"
      );
      const imgSrc = `data:${contentType};base64,${base64Image}`;

      // Generate HTML with the embedded image
      const htmlContent = `
            <!DOCTYPE html>
            <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Edubuk</title>
                    <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
                    <style>

                        .container
                            {
                                display: flex;
                                flex-direction:column;
                                justify-content: center;
                                align-items: center;
                                text-align: center;
                                row-gap: 20px;
                                width: 100%;
                                height: auto;
                                padding:10px;;
                            }
                        h1 {
                                text-align: center;
                                align-items: center;
                                color: #006666;
                            }

                        .btn
                            {
                                display: flex;
                                justify-content: center;
                                align-items: center;
                                text-align: center;
                                gap: 20px;
                            }
                        button
                            {
                                padding: 15px 30px;
                                border: 1px solid #ccc;
                                border-radius: 8px;
                                font-size: 20px;
                                cursor:pointer;
                                margin:10px 0px;
                            }
                        button:hover
                        {
                        border:1px solid #006666;
                        }
                        button:active
                        {
                        transform:translateY(2px);
                        }

                        img {
                            align-items:center;
                            max-width: 90%; /* Scale image to fit the viewport width */
                            max-height: 100%; /* Scale image to fit the viewport height */
                            width: auto; /* Maintain aspect ratio */
                            height: auto; /* Maintain aspect ratio */
                            object-fit: contain; /* Ensures the image is scaled without cropping */
                            border:1px solid #ccc;
                            border-radius:0.2rem;
                        }
                        #approve
                            {
                                color:green
                            }
                        #reject
                            {
                                color:red
                            }
                    </style>
                </head>
                <body>
                    <div class='container'>
                        <h1>Verify Certificate</h1>
                        <div class='btn'>
                        <button id='approve'>Approve</button>
                        <button id='reject'>Reject</button>
                        </div>
                        <img src="${imgSrc}" alt="Embedded Image" style="max-width: 100%; height: auto;" />                        
                    </div>
                </body>
                <script>
            document.getElementById('approve').addEventListener('click', async () => {
                try {
                    const response = await fetch(window.location.href, {
                        method: 'PUT', 
                        body: JSON.stringify({ action: 'approve' }),
                        headers: {
                            'Content-Type': 'application/json',
                        },
                    });
                    const result = await response.json();
                    if (response.ok) {
                      Swal.fire({
                      title: "Thank You!",
                      text: "Document approved",
                      icon: "success",
                      confirmButtonText: "OK",
                  }).then((result)=>{
                  if(result.isConfirmed)
                  {
                  window.location.href = "https://www.edubukeseal.com/";
                  }
                  });
                  } else {
                      const result = await response.json();
                      Swal.fire({
                          title: "Error",
                          text: result.message || "Something went wrong",
                          icon: "error",
                          confirmButtonText: "Retry",
                        });
                    }
                } catch (error) {
                    console.error('Error:', error);
                    alert('User has not submitted their CV. Please try after some time');
                }
            });
            document.getElementById('reject').addEventListener('click', async () => {
                try {
                    const response = await fetch(window.location.href, {
                        method: 'PUT', 
                        body: JSON.stringify({ action: 'reject' }),
                        headers: {
                            'Content-Type': 'application/json',
                        },
                    });
                    const result = await response.json();
                    if (response.ok) {
                      Swal.fire({
                      title: "Thank You !",
                      text: "Document successfully rejected",
                      icon: "success",
                      confirmButtonText: "OK",
                  }).then((result)=>{
                  if(result.isConfirmed)
                  {
                  window.location.href = "https://www.edubukeseal.com/";
                  }
                  });
                  } else {
                      const result = await response.json();
                      Swal.fire({
                          title: "Error",
                          text: result.message || "Something went wrong",
                          icon: "error",
                          confirmButtonText: "Retry",
                        });
                    }
                } catch (error) {
                    console.error('Error:', error);
                    alert('user has not submitted their CV. Please try after some time');
                }
            });
        </script>
            </html>
                `;
      res.setHeader("Content-Type", "text/html");
      res.send(htmlContent);
    } else {
      // Handle unsupported content types
      console.log("Unsupported content type", contentType);
      res.status(415).send({
        success: false,
        message: "Unsupported content type",
      });
    }
  } catch (error) {
    res.status(500).send({
      success: false,
      message: "Error while getting user data",
      error,
    });
  }
};
