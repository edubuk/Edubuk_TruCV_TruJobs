import React from "react";

const About: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto bg-white shadow-lg rounded-lg p-6 mt-10">
      <h1 className="text-3xl font-bold text-[#006666] mb-4">About Edubuk</h1>
      <p className="text-gray-600 mb-4">
        Our platform bridges the gap between education and employment by providing 
        emerging tech courses, verifiable academic & professional credentials, and 
        intelligent job matching leveraging AI and Blockchain Tech.
      </p>
      <p className="text-gray-600 mb-4">
        <strong className="text-[#006666]">Vision:</strong> One-Stop Platform for global 
        academic & professional credentials verification.
      </p>
      <p className="text-gray-600">
        <strong className="text-[#006666]">Mission:</strong> To provide a secure platform 
        for global verification of academic and professional credentials, thereby 
        eliminating fraud and empowering universities, employers, students, and 
        professionals globally.
      </p>
    </div>
  );
};

export default About;
