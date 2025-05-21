"use client";

// Humble imports for our form preview and PDF generation
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import axios from "axios";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import Cookies from "js-cookie";
import ClipLoader from "react-spinners/ClipLoader";
import { toast } from "sonner";
import Checkbox from "@/components/Checkbox";

interface ApplyFormData {
  name: string;
  email: string;
  dob: string;
  phone: string;
  area: string;
  landmark: string;
  address: string;
  examCityPreference1: string;
  examCityPreference2: string;
  previousCdaExperience: string;
  cdaExperienceYears: string;
  cdaExperienceRole: string;
  photo: string | null;
  signature: string | null;
  thumbprint: string | null;
  aadhaarNo: string;
  penaltyClauseAgreement: boolean;
  fever: string;
  cough: string;
  breathlessness: string;
  soreThroat: string;
  otherSymptoms: string;
  otherSymptomsDetails: string;
  closeContact: string;
  covidDeclarationAgreement: boolean;
  accountHolderName: string;
  bankName: string;
  ifsc: string;
  branch: string;
  bankAccountNo: string;
  currentDate: string;
  sonOf: string;
  resident: string;
  examName: string;
  heldDate: string;
  startDate: string;
  endDate: string;
  examCount: number;
}

export default function PreviewPage() {
  // Humble state and hooks
  const router = useRouter();
  const [isChecked, setIsChecked] = useState(false); // Checkbox ke liye state
  const [checkboxError, setCheckboxError] = useState(""); // Checkbox error message ke liye
  const [formData, setFormData] = useState<ApplyFormData | null>(null);
  const [examData, setExamData] = useState<{
    examName: string;
    heldDate: string;
    startDate: string;
    endDate: string;
    examCount: number;
  }>({
    examName: "",
    heldDate: "",
    startDate: "",
    endDate: "",
    examCount: 0,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const pdfRef = useRef<HTMLDivElement>(null);

  // Month mapping for formatting
  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  // Function to format heldDate to MM/YYYY
  const formatHeldDateNumeric = (heldDate: string) => {
    const [month, year] = heldDate.split(" ");
    const monthIndex = monthNames.indexOf(month) + 1;
    return `${monthIndex.toString().padStart(2, "0")}/${year}`;
  };

  // Function to format date to DD Month YYYY
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const day = date.getDate();
    const month = monthNames[date.getMonth()];
    const year = date.getFullYear();
    return `${day} ${month} ${year}`;
  };

  // Humble effect to load form data from sessionStorage and fetch exam data
  useEffect(() => {
    // Load form data from sessionStorage
    const data = sessionStorage.getItem("formData");
    if (data) {
      setFormData(JSON.parse(data));
      console.log(data);
    } else {
      router.push("/apply");
    }

    // Fetch latest exam data from API
    const fetchExamData = async () => {
      try {
        const response = await axios.get("/api/admin/form");
        setExamData({
          examName: response.data.data.examName, // Updated exam name
          heldDate: response.data.data.heldDate, // Updated held date
          startDate: response.data.data.startDate, // Updated start date
          endDate: response.data.data.endDate, // Updated end date
          examCount: response.data.data.examCount, // Keep examCount same
        });
      } catch (err) {
        console.error("Error fetching exam data:", err);
        toast.error("Failed to load exam details.");
      }
    };
    fetchExamData();
  }, [router]);

  // Humble effect to remove dark mode
  useEffect(() => {
    document.documentElement.classList.remove("dark");
  }, []);

  // Humble function to generate and download PDF
  const downloadPdf = async () => {
    if (!pdfRef.current) return;

    setIsLoading(true);

    try {
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "A4",
      });

      const sections = pdfRef.current.querySelectorAll(".preview-section");
      const pageWidth = 210;
      const pageHeight = 297;
      const margin = 6;
      const contentWidth = pageWidth - 2 * margin;
      let currentY = margin;

      for (let i = 0; i < sections.length; i++) {
        const originalSection = sections[i] as HTMLElement;

        // Apne original section ki ek duplicate copy banayein jisme CSS preserve ho
        const clonedSection = originalSection.cloneNode(true) as HTMLElement;
        document.body.appendChild(clonedSection); // temporary add to DOM

        // Clone ke style ko modify kar (original untouched rahega)
        clonedSection.style.width = `${pageWidth}mm`;
        clonedSection.style.padding = `${margin}mm`;
        clonedSection.style.boxSizing = "border-box";
        clonedSection.style.position = "absolute";
        clonedSection.style.left = "-9999px"; // screen ke bahar bhej do

        const canvas = await html2canvas(clonedSection, {
          scale: 2,
          useCORS: true,
          logging: true,
          windowWidth: pageWidth * 3.78,
          windowHeight: clonedSection.scrollHeight * 3,
        });

        const imgData = canvas.toDataURL("image/png");
        const imgHeight = (canvas.height * contentWidth) / canvas.width;

        if (currentY + imgHeight > pageHeight - margin && currentY !== margin) {
          pdf.addPage();
          currentY = margin;
        }

        pdf.addImage(imgData, "PNG", margin, currentY, contentWidth, imgHeight);
        currentY += imgHeight + 5;

        if (i < sections.length - 1 && currentY > pageHeight - margin) {
          pdf.addPage();
          currentY = margin;
        }

        document.body.removeChild(clonedSection); // clean up
      }

      pdf.save(`${formData?.name}-form.pdf`);
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("PDF banate waqt kuch phat gaya, try again bro!");
    } finally {
      setIsLoading(false);
    }
  };

  // Humble function to handle form submission
  const handleConfirmSubmit = async () => {
    if (!isChecked) {
      toast.error("Please accept the declaration to proceed.");
      return;
    }

    setIsLoading(true);
    setError("");
    setCheckboxError("");

    const token = Cookies.get("token");
    if (!token) {
      router.push("/login");
      return;
    }

    try {
      const response = await axios.put(
        "/api/auth/signup",
        {
          ...formData,
          examName: examData?.examName,
          heldDate: examData?.heldDate,
          startDate: examData?.startDate,
          endDate: examData?.endDate,
          examCount: examData?.examCount,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        }
      );

      toast.success("Details updated successfully!");
      sessionStorage.removeItem("formData");
      router.push("/user/submissions");
    } catch (err: any) {
      console.error("Error updating details: ", err);
      toast.error("Error updating details. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Humble loading state
  if (!formData || !examData) return <div>Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-6">
          Application Preview
        </h1>

        {/* Humble buttons for download and print */}
        <div className="flex justify-center gap-4 mb-6">
          <Button
            onClick={downloadPdf}
            className="bg-green-600 text-white hover:bg-green-700 relative"
            disabled={isLoading}
          >
            {isLoading && (
              <span className="absolute left-1/2 -translate-x-1/2">
                <ClipLoader size={20} color="#ffffff" />
              </span>
            )}
            <span className={isLoading ? "opacity-0" : ""}>Download PDF</span>
          </Button>
          {/* <Button
            onClick={() => window.print()}
            className="bg-yellow-600 text-white hover:bg-yellow-700"
          >
            Print Preview
          </Button> */}
        </div>

        <div className="print-container" ref={pdfRef}>
          {/* Humble Appointment Letter Section (StarParth) */}
          <div className="preview-section">
            <div className="flex justify-center mb-4">
              <img
                src="/starparth-logo.png"
                alt="StarParth Logo"
                width={200}
                height={200}
                className="object-contain"
                crossOrigin="anonymous"
              />
            </div>
            <div className="text-center mb-4">
              <p className="text-xl font-bold">
                STARPARTH TECHNOLOGIES PVT LTD
              </p>
              <p className="text-sm">
                CHIEF INVIGILATOR NON-PARTICIPATION / NO RELATION &
                CONFIDENTIALITY AGREEMENT & APPOINTMENT LETTER
              </p>
            </div>
            <p className="text-sm">
              I <strong>{formData.name || "__________"}</strong> S/O{" "}
              <strong>{formData.sonOf || "__________"}</strong> hereby declare
              that I am not appearing in the{" "}
              <strong className="underline">
                {examData.examName || "__________"}
              </strong>{" "}
              Examination,{" "}
              <strong className="underline">
                {examData.examCount
                  ? examData.examCount.toString().padStart(2, "0")
                  : "___"}
              </strong>
              /
              <strong className="underline">
                {examData.heldDate || "__________"}
              </strong>
              , held from{" "}
              <strong className="underline">
                {formatDate(examData.startDate)}
              </strong>{" "}
              to{" "}
              <strong className="underline">
                {formatDate(examData.endDate)}
              </strong>{" "}
              as a candidate either at the exam centre or have been deputed at
              any other centre which is involved in the conduct of the exam. If
              I am absent or leave the examination Centre at any time, in any
              scenario on the above mentioned dates, or found doing any
              Suspicious Activity / Malpractice / Unethical Behavior /
              Professional Misconduct, then NetParam Technologies Pvt Ltd /
              NETCOM/C-DAC/
              {examData.examName || "__________"} has full authority to take any
              disciplinary action (regarding Duty Code of Conduct, as specified
              in IPC Section).
            </p>
            <p className="text-sm mb-2">
              As a condition of serving as an Operations Chief Invigilator of
              StarParth Technologies Pvt Ltd, I understand and agree to accept
              the responsibility for maintaining and protecting the confidential
              nature of StarParth Technologies Pvt Ltd and related resources. I
              understand that revealing the contents of the test in the form of
              any duplication, unauthorized distribution, disclosure, or other
              breaches of confidentiality can render the tests unusable and/or
              severely compromised with respect to the purpose for which they
              are administered. As a Chief Invigilator, I agree that:
            </p>
            <ol className="list-decimal list-inside text-sm mb-4 pl-4">
              <li>
                Will oversee and carry out the administration of StarParth
                Technologies Pvt Ltd tests in conformance with the conditions
                described by StarParth Technologies Pvt Ltd.
              </li>
              <li>
                Will not, directly or indirectly, in any way compromise the
                security of any tests or their content.
              </li>
              <li>
                Only I am responsible for my own behavior, character, or any
                other work that is beyond my authorization.
              </li>
            </ol>
            <p className="text-sm mb-2 font-bold">Required documents:</p>
            <ol className="list-decimal list-inside text-sm mb-4 pl-4">
              <li>Photo Id Proof (Aadhaar Card / PAN Card)</li>
              <li>2 Passport Size Photo</li>
            </ol>
            <div className="grid grid-cols-2 gap-4 text-sm mb-4">
              <div>
                <p>
                  Name: <strong>{formData.name || "__________"}</strong>
                </p>
                <p>
                  Email: <strong>{formData.email || "__________"}</strong>
                </p>
                <p>
                  DOB: <strong>{formData.dob || "__________"}</strong>
                </p>
                <p>
                  Mobile No.: <strong>{formData.phone || "__________"}</strong>
                </p>
                <p>
                  Area: <strong>{formData.area || "__________"}</strong>
                </p>
                <p>
                  Landmark: <strong>{formData.landmark || "__________"}</strong>
                </p>
                <p>
                  Address: <strong>{formData.address || "__________"}</strong>
                </p>
                <p>
                  Date: <strong>{formData.currentDate || "__________"}</strong>
                </p>
                <p>Signature: </p>{" "}
                {formData.signature ? (
                  <div className="w-24 h-auto  mt-2">
                    <img
                      src={formData.signature}
                      alt="Signature"
                      className="object-contain"
                    />
                  </div>
                ) : (
                  "____________________"
                )}
              </div>
              <div className="flex flex-col items-center">
                {formData.photo ? (
                  <div className="w-[150px] h-[150px]  mb-4">
                    <img
                      src={formData.photo}
                      alt="Photo"
                      className="w-full h-full object-contain"
                    />
                  </div>
                ) : (
                  <div className="w-24 h-32  mb-4"></div>
                )}
                <p>Thumb Impression</p>
                {formData.thumbprint ? (
                  <div className="w-36 h-16  mt-2">
                    <img
                      src={formData.thumbprint}
                      alt="Thumbprint"
                      className="w-full h-full object-contain"
                    />
                  </div>
                ) : (
                  <div className="w-24 h-16  "></div>
                )}
              </div>
            </div>
            <div className="text-sm">
              <p>
                Exam city Preference - 1){" "}
                <strong>{formData.examCityPreference1 || "__________"}</strong>{" "}
                2){" "}
                <strong>{formData.examCityPreference2 || "__________"}</strong>
              </p>
              <p>
                Previous CDAC Exam Experience -{" "}
                <strong>
                  {formData.previousCdaExperience || "__________"}
                </strong>{" "}
                | No. of Years{" "}
                <strong>{formData.cdaExperienceYears || "__________"}</strong> |
                Role-{" "}
                <strong>{formData.cdaExperienceRole || "__________"}</strong>
              </p>
              <p className="italic text-xs">
                *The meaning of relatives is defined as under: Wife, husband,
                son, daughter, grand-son, granddaughter, brother, sister,
                son-in-law, sister-in-law, daughter-in-law, nephew, niece,
                sister’s daughter and son and their son and their son and
                daughter, uncle, aunty.
              </p>
              <p className="text-xs">
                Note:- Exam City preference doesn’t guarantee for the actual
                allocation, it’s only a probability.
              </p>
            </div>
          </div>

          {/* Humble Self-Declaration - COVID-19 Section */}
          <div className="preview-section ">
            <div className="flex justify-center">
              <img
                src="/starparth-logo.png"
                alt="StarParth Logo"
                width={200}
                height={200}
                className="object-contain"
                crossOrigin="anonymous"
              />
            </div>
            <div className="text-center">
              <p className="text-[11px] underline">
                <strong>{examData.examName || "__________"}</strong>{" "}
                <strong>
                  {examData.examCount
                    ? examData.examCount.toString().padStart(2, "0")
                    : "___"}
                  /
                  <strong>
                    {examData.heldDate
                      ? new Date(examData.heldDate).getFullYear()
                      : "__________"}
                  </strong>
                  (
                </strong>
                <strong>{formatDate(examData.startDate)}</strong> to{" "}
                <strong>{formatDate(examData.endDate)}</strong> )
                {/* Updated exam name and dates */}
              </p>
              <p className="text-[11px] font-bold">
                Self-Declaration - COVID-19
              </p>
            </div>
            <div className="text-[11px]">
              <div className="flex justify-start gap-56">
                {" "}
                <p>
                  Name:{" "}
                  <strong className="underline">
                    {formData.name || "__________"}
                  </strong>
                </p>
                <p>
                  Id Proof:{" "}
                  <strong className="underline">
                    {formData.aadhaarNo || "__________"}
                  </strong>
                </p>
              </div>
              <p>Centre Code: __________ Centre Name: __________</p>
              <p>City: __________ ATC's / C-DAC Centre's Name: __________</p>
              <p className="font-bold ">
                1. Do you have any of the following flu-like symptoms:
              </p>
              <ul className="list-none pl-4">
                {/* a. Fever */}
                <li className="flex items-center space-x-4">
                  <span className="w-60">a. Fever</span>
                  {formData.fever?.toLowerCase() === "yes" ? (
                    <Checkbox text={"Yes"} isChecked={true} />
                  ) : (
                    <Checkbox text={"Yes"} isChecked={false} />
                  )}
                  {formData.fever?.toLowerCase() === "no" ? (
                    <Checkbox text={"No"} isChecked={true} />
                  ) : (
                    <Checkbox text={"No"} isChecked={false} />
                  )}
                </li>

                {/* b. Cough */}
                <li className="flex items-center space-x-4">
                  <span className="w-60">b. Cough</span>
                  {formData.cough?.toLowerCase() === "yes" ? (
                    <Checkbox text={"Yes"} isChecked={true} />
                  ) : (
                    <Checkbox text={"Yes"} isChecked={false} />
                  )}
                  {formData.cough?.toLowerCase() === "no" ? (
                    <Checkbox text={"No"} isChecked={true} />
                  ) : (
                    <Checkbox text={"No"} isChecked={false} />
                  )}
                </li>

                {/* c. Breathlessness */}
                <li className="flex items-center space-x-4">
                  <span className="w-60">c. Breathlessness</span>
                  {formData.breathlessness?.toLowerCase() === "yes" ? (
                    <Checkbox text={"Yes"} isChecked={true} />
                  ) : (
                    <Checkbox text={"Yes"} isChecked={false} />
                  )}
                  {formData.breathlessness?.toLowerCase() === "no" ? (
                    <Checkbox text={"No"} isChecked={true} />
                  ) : (
                    <Checkbox text={"No"} isChecked={false} />
                  )}
                </li>

                {/* d. Sore Throat */}
                <li className="flex items-center space-x-4">
                  <span className="w-60">d. Sore Throat</span>
                  {formData.soreThroat?.toLowerCase() === "yes" ? (
                    <Checkbox text={"Yes"} isChecked={true} />
                  ) : (
                    <Checkbox text={"Yes"} isChecked={false} />
                  )}
                  {formData.soreThroat?.toLowerCase() === "no" ? (
                    <Checkbox text={"No"} isChecked={true} />
                  ) : (
                    <Checkbox text={"No"} isChecked={false} />
                  )}
                </li>

                {/* e. Others */}
                <li className="flex items-center space-x-4">
                  <span className="w-60">e. Others: Please specify</span>
                  {formData.otherSymptoms?.toLowerCase() === "yes" ? (
                    <Checkbox text={"Yes"} isChecked={true} />
                  ) : (
                    <Checkbox text={"Yes"} isChecked={false} />
                  )}
                  {formData.otherSymptoms?.toLowerCase() === "no" ? (
                    <Checkbox text={"No"} isChecked={true} />
                  ) : (
                    <Checkbox text={"No"} isChecked={false} />
                  )}
                </li>
              </ul>

              {/* Question 2 - Close Contact */}
              <p className="font-bold">
                2. Have you or an immediate family member come in close contact
                with a confirmed case of the coronavirus in the last 14 days?
                <br />
                <span className="font-normal text-[11px]">
                  ("Close contact" means being at a distance of less than one
                  meter for more than 15 minutes.)
                </span>
              </p>
              <div className="flex space-x-6">
                {formData.closeContact?.toLowerCase() === "yes" ? (
                  <Checkbox text={"Yes"} isChecked={true} />
                ) : (
                  <Checkbox text={"Yes"} isChecked={false} />
                )}
                {formData.closeContact?.toLowerCase() === "no" ? (
                  <Checkbox text={"No"} isChecked={true} />
                ) : (
                  <Checkbox text={"No"} isChecked={false} />
                )}
              </div>

              <p className="">
                I hereby declare that all the information mentioned above is
                true to the best of my knowledge and will immediately inform to
                Covid -19 Central/State Govt. authority, if any symptoms arise
                during or after examination.
              </p>
              <div className="">
                {/* Signature, Date, Place ek hi line mein, Signature image ke saath */}
                <div className="flex flex-wrap justify-between items-center gap-4">
                  {/* Signature image aur text ek line mein */}
                  <div className="flex items-center gap-2">
                    <p>Signature:</p>
                    {formData.signature ? (
                      <div className="w-24 h-12">
                        <img
                          src={formData.signature}
                          alt="Signature"
                          className="object-contain"
                        />
                      </div>
                    ) : (
                      <span>____________________</span>
                    )}
                  </div>

                  {/* Date */}
                  <p>
                    Date:{" "}
                    <strong>{formData.currentDate || "__________"}</strong>
                  </p>

                  {/* Place */}
                  <p>
                    Place: <strong>{formData.resident || "__________"}</strong>
                  </p>
                </div>

                {/* Neeche ek sidhi line */}
                <hr className="border-t-2 border-black mt-2 " />
              </div>
            </div>
            <div className="text-center ">
              <p className="text-[11px] underline">
                <strong>{examData.examName || "__________"}</strong>{" "}
                <strong>
                  {examData.examCount
                    ? examData.examCount.toString().padStart(2, "0")
                    : "___"}
                  /
                  <strong>
                    {examData.heldDate
                      ? new Date(examData.heldDate).getFullYear()
                      : "__________"}
                  </strong>
                  (
                </strong>
                <strong>{formatDate(examData.startDate)}</strong> to{" "}
                <strong>{formatDate(examData.endDate)}</strong> )
                {/* Updated exam name and dates */}
              </p>
              <p className="text-sm font-bold">Self-Declaration - COVID-19</p>
            </div>
            <div className="text-[11px]">
              <div className="flex justify-start gap-56">
                {" "}
                <p>
                  Name:{" "}
                  <strong className="underline">
                    {formData.name || "__________"}
                  </strong>
                </p>
                <p>
                  Id Proof:{" "}
                  <strong className="underline">
                    {formData.aadhaarNo || "__________"}
                  </strong>
                </p>
              </div>
              <p>Centre Code: __________ Centre Name: __________</p>
              <p>City: __________ ATC's / C-DAC Centre's Name: __________</p>
              <p className="font-bold ">
                1. Do you have any of the following flu-like symptoms:
              </p>
              <ul className="list-none pl-4">
                {/* a. Fever */}
                <li className="flex items-center space-x-4">
                  <span className="w-60">a. Fever</span>
                  {formData.fever?.toLowerCase() === "yes" ? (
                    <Checkbox text={"Yes"} isChecked={true} />
                  ) : (
                    <Checkbox text={"Yes"} isChecked={false} />
                  )}
                  {formData.fever?.toLowerCase() === "no" ? (
                    <Checkbox text={"No"} isChecked={true} />
                  ) : (
                    <Checkbox text={"No"} isChecked={false} />
                  )}
                </li>

                {/* b. Cough */}
                <li className="flex items-center space-x-4">
                  <span className="w-60">b. Cough</span>
                  {formData.cough?.toLowerCase() === "yes" ? (
                    <Checkbox text={"Yes"} isChecked={true} />
                  ) : (
                    <Checkbox text={"Yes"} isChecked={false} />
                  )}
                  {formData.cough?.toLowerCase() === "no" ? (
                    <Checkbox text={"No"} isChecked={true} />
                  ) : (
                    <Checkbox text={"No"} isChecked={false} />
                  )}
                </li>

                {/* c. Breathlessness */}
                <li className="flex items-center space-x-4">
                  <span className="w-60">c. Breathlessness</span>
                  {formData.breathlessness?.toLowerCase() === "yes" ? (
                    <Checkbox text={"Yes"} isChecked={true} />
                  ) : (
                    <Checkbox text={"Yes"} isChecked={false} />
                  )}
                  {formData.breathlessness?.toLowerCase() === "no" ? (
                    <Checkbox text={"No"} isChecked={true} />
                  ) : (
                    <Checkbox text={"No"} isChecked={false} />
                  )}
                </li>

                {/* d. Sore Throat */}
                <li className="flex items-center space-x-4">
                  <span className="w-60">d. Sore Throat</span>
                  {formData.soreThroat?.toLowerCase() === "yes" ? (
                    <Checkbox text={"Yes"} isChecked={true} />
                  ) : (
                    <Checkbox text={"Yes"} isChecked={false} />
                  )}
                  {formData.soreThroat?.toLowerCase() === "no" ? (
                    <Checkbox text={"No"} isChecked={true} />
                  ) : (
                    <Checkbox text={"No"} isChecked={false} />
                  )}
                </li>

                {/* e. Others */}
                <li className="flex items-center space-x-4">
                  <span className="w-60">e. Others: Please specify</span>
                  {formData.otherSymptoms?.toLowerCase() === "yes" ? (
                    <Checkbox text={"Yes"} isChecked={true} />
                  ) : (
                    <Checkbox text={"Yes"} isChecked={false} />
                  )}
                  {formData.otherSymptoms?.toLowerCase() === "no" ? (
                    <Checkbox text={"No"} isChecked={true} />
                  ) : (
                    <Checkbox text={"No"} isChecked={false} />
                  )}
                </li>
              </ul>

              {/* Question 2 - Close Contact */}
              <p className="font-bold">
                2. Have you or an immediate family member come in close contact
                with a confirmed case of the coronavirus in the last 14 days?
                <br />
                <span className="font-normal text-[11px]">
                  ("Close contact" means being at a distance of less than one
                  meter for more than 15 minutes.)
                </span>
              </p>
              <div className="flex space-x-6">
                {formData.closeContact?.toLowerCase() === "yes" ? (
                  <Checkbox text={"Yes"} isChecked={true} />
                ) : (
                  <Checkbox text={"Yes"} isChecked={false} />
                )}
                {formData.closeContact?.toLowerCase() === "no" ? (
                  <Checkbox text={"No"} isChecked={true} />
                ) : (
                  <Checkbox text={"No"} isChecked={false} />
                )}
              </div>

              <p className="">
                I hereby declare that all the information mentioned above is
                true to the best of my knowledge and will immediately inform to
                Covid -19 Central/State Govt. authority, if any symptoms arise
                during or after examination.
              </p>
              <div className="">
                {/* Signature, Date, Place ek hi line mein, Signature image ke saath */}
                <div className="flex flex-wrap justify-between items-center gap-4">
                  {/* Signature image aur text ek line mein */}
                  <div className="flex items-center justify-center gap-2 mt-2">
                    <p>Signature:</p>
                    {formData.signature ? (
                      <div className="w-24 h-12">
                        <img
                          src={formData.signature}
                          alt="Signature"
                          className="object-contain h-full"
                        />
                      </div>
                    ) : (
                      <span>____________________</span>
                    )}
                  </div>

                  {/* Date */}
                  <p>
                    Date:{" "}
                    <strong>{formData.currentDate || "__________"}</strong>
                  </p>

                  {/* Place */}
                  <p>
                    Place: <strong>{formData.resident || "__________"}</strong>
                  </p>
                </div>

                {/* Neeche ek sidhi line */}
                <hr className="border-t-2 border-black mt-2" />
              </div>
            </div>
          </div>

          {/* Humble Undertaking Section (StarParth) */}
          <div className="preview-section">
            <div className="text-center mb-4">
              <p className="text-[36px] font-bold underline">Undertaking</p>
            </div>
            <div className="text-[16px] mt-15 ">
              <p>
                I <strong>{formData.name || "__________"}</strong> S/O{" "}
                <strong>{formData.sonOf || "__________"}</strong> Resident of{" "}
                <strong>{formData.resident || "__________"}</strong> Aadhaar No.{" "}
                <strong>{formData.aadhaarNo || "__________"}</strong> is working
                for the{" "}
                <strong className="underline">
                  {examData.examName || "__________"}
                </strong>{" "}
                Examination held from{" "}
                <strong className="underline">
                  {formatDate(examData.startDate)}
                </strong>{" "}
                to{" "}
                <strong className="underline">
                  {formatDate(examData.endDate)}
                </strong>{" "}
                {/* Updated exam name and dates */}
              </p>
              <p className="pt-2">
                I will be there at from
                <strong className="underline">
                  {formatDate(examData.startDate)}
                </strong>{" "}
                to{" "}
                <strong className="underline">
                  {formatDate(examData.endDate)}
                </strong>{" "}
                and this is final confirmation, and I will not refuse in any
                condition. {/* Updated dates */}
              </p>
              <p className="font-bold mt-4">Penalty Clause:</p>
              <ol className="list-decimal list-inside mb-4 pl-4 my-5">
                <li>
                  I hereby take a responsibility of all the hardware items
                  provided to me for conduction of smooth examination will
                  submit once the examination will be over without any damage.
                  If any damage will be there, you may authorise to charge the
                  penalty equalling to the loss happen whatever.
                </li>
                <li>
                  I hereby commit for my behaviour during examination. If Exam
                  will be start before 5 minutes in any slot during the entire
                  Examination and I have the charge of Server Handling, I agree
                  to penalize myself for this mistake from my side.
                </li>
                <li>
                  I hereby responsible for whatever duties will be given on the
                  centre i.e., SSA-1,SSA-2 whatever decided on the centre during
                  examination and if any discrepancy will be occur from my side
                  for that particular responsibility and eligible for penalty, I
                  am agreeing to pay the sum of the penalty because of my
                  irresponsible behaviour.
                </li>
                <li>
                  If I would be found guilty in any Suspicious Activity/
                  Malpractice/ Unethical Behaviour/ Professional Misconduct
                  during whole Examination Process, Company will fully right to
                  wave off my all payment whatever I am eligible for taken off
                  during the course.
                </li>
                <li>
                  All the documents and information whatever I had submitted to
                  StarParth Technologies Pvt Ltd are correct and genuine. If any
                  of the document/information found guilty, I would be wholly
                  responsible for the same and company will fully authorize to
                  take a legal action and no pay-out will be given to me as a
                  penalty.
                </li>
                <li>
                  If I will backout after this confirmation due to any of the
                  reason, I should be penalized for the same and debarred to
                  function as a Chief Invigilator in all future Examination of
                  StarParth Technologies Pvt Ltd or their client.
                </li>
              </ol>
              <p>
                Company will have penalized me either if any of the above points
                could be happen or any other mistake from my side which could be
                harmful for the Examination and beyond the scope of work in any
                manner during the entire project.
              </p>
              <div className="flex justify-between mt-4">
                <p>
                  Name: <strong>{formData.name || "__________"}</strong>
                </p>
                <p>
                  Mobile No: <strong>{formData.phone || "__________"}</strong>
                </p>
              </div>
              <hr className="border-t-2 border-black mt-2" />
              <div className="flex justify-between mt-2">
                <p className="text-center">
                  {formData.signature ? (
                    <div className="w-15 h-auto  mt-2">
                      <img
                        src={formData.signature}
                        alt="Signature"
                        className=" object-contain"
                      />
                    </div>
                  ) : (
                    "____________________"
                  )}
                  Signature:
                </p>
                <div className="w-36 h-16  mt-2">
                  <img
                    src={formData.thumbprint || undefined}
                    alt="Thumbprint"
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>
            </div>
          </div>
          {/* Humble Payout Section (StarParth) */}
          <div className="preview-section ">
            <div className="text-center ">
              <p className="text-[36px] font-bold underline">Payout</p>
            </div>
            <div className="text-[16px]">
              <p>
                I <strong>{formData.name || "__________"}</strong> S/O{" "}
                <strong>{formData.sonOf || "__________"}</strong> Resident of{" "}
                <strong>{formData.resident || "__________"}</strong> Aadhaar No.{" "}
                <strong>{formData.aadhaarNo || "__________"}</strong> is working
                for the{" "}
                <strong className="underline">
                  {examData.examName || "__________"}
                </strong>{" "}
                Examination held from
                <strong className="underline">
                  {formatDate(examData.startDate)}
                </strong>{" "}
                to{" "}
                <strong className="underline">
                  {formatDate(examData.endDate)}
                </strong>{" "}
                {/* Updated exam name and dates */}
              </p>
              <p className="mt-2">
                I will be there at from{" "}
                <strong className="underline">
                  {formatDate(examData.startDate)}
                </strong>{" "}
                to{" "}
                <strong className="underline">
                  {formatDate(examData.endDate)}
                </strong>{" "}
                and this is final confirmation, and I will not refuse in any
                condition. {/* Updated dates */}
              </p>
              <p className="mt-2">
                I will be agreeing to work as a Chief Invigilator on behalf of
                StarParth Technologies Pvt Ltd on the payout of Rs.{" "}
                <strong>___/Day</strong> as a remuneration for the No. of days
                how I should be deployed on the centre according to allocation
                on that particular centre.
              </p>
              <p className="font-bold mt-4">My Bank Details are as under:</p>
              <div className=" mb-4">
                <p>
                  Account Holder Name:{" "}
                  <strong>{formData.accountHolderName || "__________"}</strong>
                </p>
                <p>
                  Bank Name:{" "}
                  <strong>{formData.bankName || "__________"}</strong>
                </p>
                <p>
                  IFSC: <strong>{formData.ifsc || "__________"}</strong>
                </p>
                <p>
                  Branch: <strong>{formData.branch || "__________"}</strong>
                </p>
                <p>
                  Bank Account No.:{" "}
                  <strong>{formData.bankAccountNo || "__________"}</strong>
                </p>
              </div>
              <p>
                Cancelled cheque/ Passbook copy should be attached for Reference
              </p>
              <p className="mt-2">
                Note: - Payment will be given for the above duty and attendance
                whatever applicable from StarParth Technologies Pvt Ltd in your
                above-mentioned account through IMPS/NEFT or through CASH.
              </p>
              <div className="flex flex-wrap justify-between items-center gap-4 mt-5">
                {/* Signature image aur text ek line mein */}
                <div className="flex items-center gap-2">
                  <p>Signature:</p>
                  {formData.signature ? (
                    <div className="w-24 h-12">
                      <img
                        src={formData.signature}
                        alt="Signature"
                        className="object-contain h-full "
                      />
                    </div>
                  ) : (
                    <span>____________________</span>
                  )}
                </div>

                {/* Date */}
                <p>
                  Date: <strong>{formData.currentDate || "__________"}</strong>
                </p>

                {/* Place */}
                <p>
                  Place: <strong>{formData.resident || "__________"}</strong>
                </p>
              </div>
              <hr className="border-t-2 border-black mt-2" />
              <div className="text-center mt-20">
                <p className="text-[36px] font-bold underline">Debit Note</p>
              </div>
              <div className="mt-10">
                <p className="mt-2">
                  I <strong>{formData.name || "__________"}</strong> S/O{" "}
                  <strong>{formData.sonOf || "__________"}</strong> Resident of{" "}
                  <strong>{formData.resident || "__________"}</strong> Aadhaar
                  No. <strong>{formData.aadhaarNo || "__________"}</strong> is
                  working for the{" "}
                  <strong className="underline">
                    {examData.examName || "____"}
                  </strong>{" "}
                  Examination held from{" "}
                  <strong className="underline">
                    {formatDate(examData.startDate)}
                  </strong>{" "}
                  to{" "}
                  <strong className="underline">
                    {formatDate(examData.endDate)}
                  </strong>{" "}
                  {/* Updated exam name and dates */}
                </p>
                <p className="mt-2">
                  I am interested to join a Certification Program i.e., Basic
                  Certificate Course in Online Exam Management System for the
                  duration of 80 Hours.
                </p>
                <p className="mt-2">
                  To Join this certification program, I am authorizing StarParth
                  Technologies Pvt Ltd to Debit a Sum of Rs.{" "}
                  <strong>___</strong> from the total payout of{" "}
                  <strong className="underline">
                    {examData.examName || "____"}
                  </strong>{" "}
                  prior and after deducting this amount rest of amount will pay
                  me through Bank/ Cash. {/* Updated exam name */}
                </p>
              </div>
              <div className="flex flex-wrap justify-between items-center gap-4 mt-5">
                {/* Signature image aur text ek line mein */}
                <div className="flex items-center gap-2">
                  <p>Signature:</p>
                  {formData.signature ? (
                    <div className="w-24 h-12">
                      <img
                        src={formData.signature}
                        alt="Signature"
                        className="object-contain"
                      />
                    </div>
                  ) : (
                    <span>____________________</span>
                  )}
                </div>

                {/* Date */}
                <p>
                  Date: <strong>{formData.currentDate || "__________"}</strong>
                </p>

                {/* Place */}
                <p>
                  Place: <strong>{formData.resident || "__________"}</strong>
                </p>
              </div>
              <hr className="border-t-2 border-black mt-2" />
            </div>
          </div>

          {/* Humble Undertaking Section (Netparam) */}
          <div className="preview-section">
            <div className="text-center mb-4">
              <p className="text-[36px] font-bold underline">Undertaking</p>
            </div>
            <div className="text-[16px] mt-15 ">
              <p>
                I <strong>{formData.name || "__________"}</strong> S/O{" "}
                <strong>{formData.sonOf || "__________"}</strong> Resident of{" "}
                <strong>{formData.resident || "__________"}</strong> Aadhaar No.{" "}
                <strong>{formData.aadhaarNo || "__________"}</strong> is working
                for the{" "}
                <strong className="underline">
                  {examData.examName || "__________"}
                </strong>{" "}
                Examination held from{" "}
                <strong className="underline">
                  {formatDate(examData.startDate)}
                </strong>{" "}
                to{" "}
                <strong className="underline">
                  {formatDate(examData.endDate)}
                </strong>{" "}
                {/* Updated exam name and dates */}
              </p>
              <p className="pt-2">
                I will be there at from
                <strong className="underline">
                  {formatDate(examData.startDate)}
                </strong>{" "}
                to{" "}
                <strong className="underline">
                  {formatDate(examData.endDate)}
                </strong>{" "}
                and this is final confirmation, and I will not refuse in any
                condition. {/* Updated dates */}
              </p>
              <p className="font-bold mt-4">Penalty Clause:</p>
              <ol className="list-decimal list-inside mb-4 pl-4 my-5">
                <li>
                  I hereby take a responsibility of all the hardware items
                  provided to me for conduction of smooth examination will
                  submit once the examination will be over without any damage.
                  If any damage will be there, you may authorise to charge the
                  penalty equalling to the loss happen whatever.
                </li>
                <li>
                  I hereby commit for my behaviour during examination. If Exam
                  will be start before 5 minutes in any slot during the entire
                  Examination and I have the charge of Server Handling, I agree
                  to penalize myself for this mistake from my side.
                </li>
                <li>
                  I hereby responsible for whatever duties will be given on the
                  centre i.e., SSA-1,SSA-2 whatever decided on the centre during
                  examination and if any discrepancy will be occur from my side
                  for that particular responsibility and eligible for penalty, I
                  am agreeing to pay the sum of the penalty because of my
                  irresponsible behaviour.
                </li>
                <li>
                  If I would be found guilty in any Suspicious Activity/
                  Malpractice/ Unethical Behaviour/ Professional Misconduct
                  during whole Examination Process, Company will fully right to
                  wave off my all payment whatever I am eligible for taken off
                  during the course.
                </li>
                <li>
                  All the documents and information whatever I had submitted to
                  StarParth Technologies Pvt Ltd are correct and genuine. If any
                  of the document/information found guilty, I would be wholly
                  responsible for the same and company will fully authorize to
                  take a legal action and no pay-out will be given to me as a
                  penalty.
                </li>
                <li>
                  If I will backout after this confirmation due to any of the
                  reason, I should be penalized for the same and debarred to
                  function as a Chief Invigilator in all future Examination of
                  StarParth Technologies Pvt Ltd or their client.
                </li>
              </ol>
              <p>
                Company will have penalized me either if any of the above points
                could be happen or any other mistake from my side which could be
                harmful for the Examination and beyond the scope of work in any
                manner during the entire project.
              </p>
              <div className="flex justify-between mt-4">
                <p>
                  Name: <strong>{formData.name || "__________"}</strong>
                </p>
                <p>
                  Mobile No: <strong>{formData.phone || "__________"}</strong>
                </p>
              </div>
              <hr className="border-t-2 border-black mt-2" />
              <div className="flex justify-between mt-2">
                <p className="text-center">
                  {formData.signature ? (
                    <div className="w-24 h-auto">
                      <img
                        src={formData.signature}
                        alt="Signature"
                        className=" object-contain"
                      />
                    </div>
                  ) : (
                    "____________________"
                  )}
                  Signature:
                </p>
                <div className="w-36 h-16  mt-2">
                  <img
                    src={formData?.thumbprint || undefined}
                    alt="Thumbprint"
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>
            </div>
          </div>
          {/* Humble Payout Section (Netparam) */}
          <div className="preview-section ">
            <div className="text-center ">
              <p className="text-[36px] font-bold underline">Payout</p>
            </div>
            <div className="text-[16px]">
              <p>
                I <strong>{formData.name || "__________"}</strong> S/O{" "}
                <strong>{formData.sonOf || "__________"}</strong> Resident of{" "}
                <strong>{formData.resident || "__________"}</strong> Aadhaar No.{" "}
                <strong>{formData.aadhaarNo || "__________"}</strong> is working
                for the{" "}
                <strong className="underline">
                  {examData.examName || "__________"}
                </strong>{" "}
                Examination held from{"  "}
                <strong className="underline">
                  {formatDate(examData.startDate)}
                </strong>{" "}
                to{" "}
                <strong className="underline">
                  {formatDate(examData.endDate)}
                </strong>{" "}
                {/* Updated exam name and dates */}
              </p>
              <p className="mt-2">
                I will be there at from{" "}
                <strong className="underline">
                  {formatDate(examData.startDate)}
                </strong>{" "}
                to{" "}
                <strong className="underline">
                  {formatDate(examData.endDate)}
                </strong>{" "}
                and this is final confirmation, and I will not refuse in any
                condition. {/* Updated dates */}
              </p>
              <p className="mt-2">
                I will be agreeing to work as a Chief Invigilator on behalf of
                StarParth Technologies Pvt Ltd on the payout of Rs.{" "}
                <strong>___/Day</strong> as a remuneration for the No. of days
                how I should be deployed on the centre according to allocation
                on that particular centre.
              </p>
              <p className="font-bold mt-4">My Bank Details are as under:</p>
              <div className=" mb-4">
                <p>
                  Account Holder Name:{" "}
                  <strong>{formData.accountHolderName || "__________"}</strong>
                </p>
                <p>
                  Bank Name:{" "}
                  <strong>{formData.bankName || "__________"}</strong>
                </p>
                <p>
                  IFSC: <strong>{formData.ifsc || "__________"}</strong>
                </p>
                <p>
                  Branch: <strong>{formData.branch || "__________"}</strong>
                </p>
                <p>
                  Bank Account No.:{" "}
                  <strong>{formData.bankAccountNo || "__________"}</strong>
                </p>
              </div>
              <p>
                Cancelled cheque/ Passbook copy should be attached for Reference
              </p>
              <p className="mt-2">
                Note: - Payment will be given for the above duty and attendance
                whatever applicable from StarParth Technologies Pvt Ltd in your
                above-mentioned account through IMPS/NEFT or through CASH.
              </p>
              <div className="flex flex-wrap justify-between items-center gap-4 mt-5">
                {/* Signature image aur text ek line mein */}
                <div className="flex items-center gap-2">
                  <p>Signature:</p>
                  {formData.signature ? (
                    <div className="w-15 h-auto">
                      <img
                        src={formData.signature}
                        alt="Signature"
                        className="object-contain h-full"
                      />
                    </div>
                  ) : (
                    <span>____________________</span>
                  )}
                </div>

                {/* Date */}
                <p>
                  Date: <strong>{formData.currentDate || "__________"}</strong>
                </p>

                {/* Place */}
                <p>
                  Place: <strong>{formData.resident || "__________"}</strong>
                </p>
              </div>
              <hr className="border-t-2 border-black mt-2" />
              <div className="text-center mt-20">
                <p className="text-[36px] font-bold underline">Debit Note</p>
              </div>
              <div className="mt-10">
                <p className="mt-2">
                  I <strong>{formData.name || "__________"}</strong> S/O{" "}
                  <strong>{formData.sonOf || "__________"}</strong> Resident of{" "}
                  <strong>{formData.resident || "__________"}</strong> Aadhaar
                  No. <strong>{formData.aadhaarNo || "__________"}</strong> is
                  working for the{" "}
                  <strong className="underline">
                    {examData.examName || "____"}
                  </strong>{" "}
                  Examination held from{" "}
                  <strong className="underline">
                    {formatDate(examData.startDate)}
                  </strong>{" "}
                  to{" "}
                  <strong className="underline">
                    {formatDate(examData.endDate)}
                  </strong>{" "}
                  {/* Updated exam name and dates */}
                </p>
                <p className="mt-2">
                  I am interested to join a Certification Program i.e., Basic
                  Certificate Course in Online Exam Management System for the
                  duration of 80 Hours.
                </p>
                <p className="mt-2">
                  To Join this certification program, I am authorizing StarParth
                  Technologies Pvt Ltd to Debit a Sum of Rs.{" "}
                  <strong>___</strong> from the total payout of{" "}
                  <strong className="underline">
                    {examData.examName || "____"}
                  </strong>{" "}
                  prior and after deducting this amount rest of amount will pay
                  me through Bank/ Cash. {/* Updated exam name */}
                </p>
              </div>
              <div className="flex flex-wrap justify-between items-center gap-4 mt-5">
                {/* Signature image aur text ek line mein */}
                <div className="flex items-center gap-2">
                  <p>Signature:</p>
                  {formData.signature ? (
                    <div className="w-24 h-12">
                      <img
                        src={formData.signature}
                        alt="Signature"
                        className="object-contain"
                      />
                    </div>
                  ) : (
                    <span>____________________</span>
                  )}
                </div>

                {/* Date */}
                <p>
                  Date: <strong>{formData.currentDate || "__________"}</strong>
                </p>

                {/* Place */}
                <p>
                  Place: <strong>{formData.resident || "__________"}</strong>
                </p>
              </div>
              <hr className="border-t-2 border-black mt-2" />
            </div>
          </div>

          {/* Humble Appointment Letter Section (Netparam) */}
          <div className="preview-section">
            <div className="flex justify-between mb-4 w-full">
              <img
                src="/netparam-logo.png"
                alt="Netparam Logo"
                width={200}
                height={200}
                className="object-contain"
                crossOrigin="anonymous"
              />
              <img
                src="/netparam-logo-2.png"
                alt="Netparam Secondary Logo"
                width={200}
                height={200}
                className="object-contain"
                crossOrigin="anonymous"
              />
            </div>
            <div className="text-center mb-4">
              <p className="text-xl font-bold">NETPARAM TECHNOLOGIES PVT LTD</p>
              <p className="text-sm">
                CHIEF INVIGILATOR NON-PARTICIPATION / NO RELATION &
                CONFIDENTIALITY AGREEMENT
              </p>
            </div>
            <div className="text-sm">
              <p className="text-sm mb-4">
                I <strong>{formData.name || "__________"}</strong> S/O{" "}
                <strong>{formData.sonOf || "__________"}</strong> hereby declare
                that I am not appearing in the{" "}
                <strong className="underline">
                  {examData.examName || "__________"}
                </strong>{" "}
                Examination,{" "}
                <strong className="underline">
                  {" "}
                  {examData.examCount
                    ? examData.examCount.toString().padStart(2, "0")
                    : "___"}
                </strong>{" "}
                <strong className="underline">
                  {examData.heldDate || "__________"}
                </strong>
                , held from{" "}
                <strong className="underline">
                  {formatDate(examData.startDate)}
                </strong>{" "}
                to{" "}
                <strong className="underline">
                  {formatDate(examData.endDate)}
                </strong>{" "}
                as a candidate either at the exam centre or have been deputed at
                any other centre which is involved in the conduct of the exam.
                If I am absent or leave the examination Centre at any time, in
                any scenario on the above mentioned dates, or found doing any
                Suspicious Activity / Malpractice / Unethical Behavior /
                Professional Misconduct, then NetParam Technologies Pvt Ltd /
                NETCOM/C-DAC/{examData.examName || "__________"} has full
                authority to take any disciplinary action (regarding Duty Code
                of Conduct, as specified in IPC Section).
              </p>
              <p className="mt-2">
                As a condition of serving as an Operations Chief Invigilator of
                Netparam Technologies Pvt Ltd, I understand and agree to accept
                the responsibility for maintaining and protecting the
                confidential nature of Netparam Technologies Pvt Ltd and related
                resources. I understand that revealing the contents of the test
                in the form of any duplication, unauthorized distribution,
                disclosure, or other breaches of confidentiality can render the
                tests unusable and/or severely compromised with respect to the
                purpose for which they are administered. As a Chief Invigilator,
                I agree that:
              </p>
              <ol className="list-decimal list-inside mb-4 pl-4">
                <li>
                  Will oversee and carry out the administration of Netparam
                  Technologies Pvt Ltd tests in conformance with the conditions
                  described by Netparam Technologies Pvt Ltd.
                </li>
                <li>
                  Will not, directly or indirectly, in any way compromise the
                  security of any tests or their content.
                </li>
                <li>
                  Only I am responsible for my own behavior, character, or any
                  other work that is beyond my authorization.
                </li>
              </ol>
              <p className="font-bold">Required documents:</p>
              <ol className="list-decimal list-inside mb-4 pl-4">
                <li>Photo Id Proof (Aadhaar Card / PAN Card)</li>
                <li>2 Passport Size Photo</li>
              </ol>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p>
                    Name: <strong>{formData.name || "__________"}</strong>
                  </p>
                  <p>
                    Email: <strong>{formData.email || "__________"}</strong>
                  </p>
                  <p>
                    DOB: <strong>{formData.dob || "__________"}</strong>
                  </p>
                  <p>
                    Mobile No.:{" "}
                    <strong>{formData.phone || "__________"}</strong>
                  </p>
                  <p>
                    Area: <strong>{formData.area || "__________"}</strong>
                  </p>
                  <p>
                    Landmark:{" "}
                    <strong>{formData.landmark || "__________"}</strong>
                  </p>
                  <p>
                    Address: <strong>{formData.address || "__________"}</strong>
                  </p>
                  <p>
                    Date:{" "}
                    <strong>{formData.currentDate || "__________"}</strong>
                  </p>
                  <p>
                    Signature:
                    {formData.signature ? (
                      <div className="w-24 h-auto  mt-2">
                        <img
                          src={formData.signature}
                          alt="Signature"
                          className=" object-contain"
                        />
                      </div>
                    ) : (
                      "____________________"
                    )}
                  </p>
                </div>
                <div className="flex flex-col items-center">
                  {formData.photo ? (
                    <div className="w-[150px] h-[150px]  mb-4">
                      <img
                        src={formData.photo}
                        alt="Photo"
                        className="w-full h-full object-contain"
                      />
                    </div>
                  ) : (
                    <div className="w-24 h-32  mb-4"></div>
                  )}
                  <p>Thumb Impression</p>
                  {formData.thumbprint ? (
                    <div className="w-36 h-16  mt-2">
                      <img
                        src={formData.thumbprint}
                        alt="Thumbprint"
                        className="w-full h-full object-contain"
                      />
                    </div>
                  ) : (
                    <div className="w-24 h-16  mt-2"></div>
                  )}
                </div>
              </div>
              <p>
                Exam city Preference - 1){" "}
                <strong>{formData.examCityPreference1 || "__________"}</strong>{" "}
                2){" "}
                <strong>{formData.examCityPreference2 || "__________"}</strong>
              </p>
              <p>
                Previous CDAC Exam Experience -{" "}
                <strong>
                  {formData.previousCdaExperience || "__________"}
                </strong>{" "}
                | No. of Years{" "}
                <strong>{formData.cdaExperienceYears || "__________"}</strong> |
                Role-{" "}
                <strong>{formData.cdaExperienceRole || "__________"}</strong>
              </p>
              <p className="italic text-xs">
                *The meaning of relatives is defined as under: Wife, husband,
                son, daughter, grand-son, granddaughter, brother, sister,
                son-in-law, sister-in-law, daughter-in-law, nephew, niece,
                sister’s daughter and son and their son and their son and
                daughter, uncle, aunty.
              </p>
              <p className="text-xs">
                Note:- Exam City preference doesn’t guarantee for the actual
                allocation, it’s only a probability.
              </p>
            </div>
          </div>
        </div>

        {/* Humble error display */}

        <div className="mt-6">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="declaration"
              checked={isChecked}
              onChange={(e) => {
                setIsChecked(e.target.checked);
                setCheckboxError(""); // Checkbox change hone par error clear karo
              }}
              className="h-4 w-4"
            />
            <label htmlFor="declaration" className="text-sm">
              I hereby declare that all the information provided above is true
              to the best of my knowledge, and I take full responsibility for
              its accuracy; I understand that any false information may lead to
              appropriate action against me.
            </label>
          </div>
        </div>
        {/* Humble navigation buttons */}
        <div className="flex justify-between mt-6">
          <Button
            onClick={() => router.push("/user/apply")}
            className="bg-gray-600 text-white hover:bg-gray-700"
          >
            Back to Edit
          </Button>
          <Button
            onClick={handleConfirmSubmit}
            className="bg-blue-600 text-white hover:bg-blue-700 relative"
            disabled={isLoading || !isChecked}
          >
            {isLoading ? (
              <span className="flex justify-center items-center space-x-2">
                <ClipLoader size={20} color="#ffffff" />
                <span>Submitting...</span>
              </span>
            ) : (
              "Confirm & Submit"
            )}
          </Button>
        </div>
      </div>

      {/* Humble styles for matching PDF design */}
      <style jsx>{`
        .print-container * {
          color: #000000 !important;
          background-color: #ffffff !important;
          border-color: #000000 !important;
        }
        .preview-section {
          font-family: "Times New Roman", serif;
          font-size: 12pt;
          line-height: 1.4;
          padding: 8mm;
          width: 100%;
          max-width: 190mm;
          margin: 0 auto;
          page-break-inside: avoid;
          background-color: #ffffff !important;
          box-sizing: border-box;
          max-height: 300mm; /* A4 height 297mm hai, margins ke saath 270mm tak content fit hona chahiye */
          overflow: hidden; /* Overflow content ko hide karo, taki dusre page par na jaye */
        }
        .preview-section .flex.justify-between {
          width: 100%;
          max-width: 190mm;
          padding: 0 5mm;
          box-sizing: border-box;
          position: relative;
        }
        .preview-section p,
        .preview-section li {
          margin: 4pt 0;
          color: #000000 !important;
        }
        .preview-section .text-center {
          text-align: center;
        }
        .preview-section .text-left {
          text-align: left;
        }
        .preview-section .font-bold {
          font-weight: bold;
        }
        .preview-section .underline {
          text-decoration: underline;
        }
        .preview-section .grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10mm;
        }
        .preview-section img {
          display: block;
        }
        .preview-section .text-sm p {
          margin: 2pt 0; /* Paragraphs ke beech margin kam kiya */
        }
        .preview-section .text-xs:last-child {
          position: relative;
          bottom: 0; /* Last paragraph ko bottom se fix karo */
          margin-top: 1pt;
          page-break-inside: avoid;
          display: block;
        }
        .bg-gray-100 {
          background-color: #f3f4f6 !important;
        }
        .bg-green-600 {
          background-color: #16a34a !important;
        }
        .bg-yellow-600 {
          background-color: #d97706 !important;
        }
        .bg-blue-600 {
          background-color: #2563eb !important;
        }
        .text-white {
          color: #ffffff !important;
        }
        .text-red-500 {
          color: #ef4444 !important;
        }
        @media print {
          .print-container .preview-section {
            // border: 1px solid #000;
            //padding: 8mm;
            page-break-inside: avoid;
            page-break-before: auto;
            page-break-after: auto;
            width: 210mm;
            max-width: 210mm;
            margin: 0;
            max-height: 300mm; /* Print ke time bhi height fix rakho */
          }
          button,
          h1,
          .flex.justify-center.gap-4.mb-6,
          .flex.justify-between.mt-6,
          p.text-red-500.text-center.mt-4 {
            display: none;
          }
          body {
            background-color: #ffffff !important;
            color: #000000 !important;
            margin: 0;
          }
        }
      `}</style>
    </div>
  );
}
