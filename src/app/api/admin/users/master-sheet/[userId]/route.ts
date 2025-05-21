import mongoose from "mongoose";
import MasterSheet, { IMasterSheet } from "@/models/MasterUser";
import User, { IUser } from "@/models/User";
import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";

type Context = {
  params: {
    userId: string;
  };
};

// Common function to add user to master sheet
const addToMasterSheet = async (user: IUser): Promise<boolean> => {
  try {
    const exists = await MasterSheet.findOne({
      userId: user._id,
      email: user.email,
      phone: user.phone,
    });

    if (!exists) {
      await MasterSheet.create({
        userId: user._id,
        name: user.name,
        email: user.email,
        password: user.password || "",
        dob: user.dob || "",
        phone: user.phone || "",
        area: user.area || "",
        landmark: user.landmark || "",
        address: user.address || "",
        examCityPreference1: user.examCityPreference1 || "",
        examCityPreference2: user.examCityPreference2 || "",
        previousCdaExperience: user.previousCdaExperience || "No",
        cdaExperienceYears: user.cdaExperienceYears || "",
        cdaExperienceRole: user.cdaExperienceRole || "",
        photo: user.photo || "",
        signature: user.signature || "",
        thumbprint: user.thumbprint || "",
        aadhaarNo: user.aadhaarNo || "",
        penaltyClauseAgreement: user.penaltyClauseAgreement || false,
        fever: user.fever || "No",
        cough: user.cough || "No",
        breathlessness: user.breathlessness || "No",
        soreThroat: user.soreThroat || "No",
        otherSymptoms: user.otherSymptoms || "No",
        otherSymptomsDetails: user.otherSymptomsDetails || "",
        closeContact: user.closeContact || "No",
        covidDeclarationAgreement: user.covidDeclarationAgreement || false,
        accountHolderName: user.accountHolderName || "",
        bankName: user.bankName || "",
        ifsc: user.ifsc || "",
        branch: user.branch || "",
        bankAccountNo: user.bankAccountNo || "",
        currentDate: user.currentDate || new Date().toISOString().split("T")[0],
        sonOf: user.sonOf || "", // Ensure this is not undefined
        resident: user.resident || "", // Ensure this is not undefined
        role: user.role || "candidate",
        status: user.status || "approve",
        approvedAt: new Date(),
        createdAt: user.createdAt || new Date(),
      });

      return true;
    } else {
      console.log(
        `User ${user.name} already in master sheet with matching email and phone, skipping...`
      );
      return false;
    }
  } catch (error: any) {
    console.error("Master sheet add mein error:", error.message, error.stack);
    throw error;
  }
};
// PUT handler for approving user
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    await connectToDatabase();
    console.log("Database connected successfully");

    const { userId } = await params;

    if (!params || !userId) {
      return NextResponse.json(
        { message: "User ID missing in request" },
        { status: 400 }
      );
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return NextResponse.json({ message: "Invalid user ID" }, { status: 400 });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { status: "approve" },
      { new: true }
    );

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    // Validate required fields
    if (!user.email || !user.phone || !user.sonOf || !user.resident) {
      console.error(`User ${user.name} has missing required fields`);
      return NextResponse.json(
        {
          message:
            "User data incomplete: email, phone, sonOf, or resident missing",
        },
        { status: 400 }
      );
    }

    const added = await addToMasterSheet(user);
    if (added) {
      return NextResponse.json(
        { message: `${user.name} approved and added to master sheet!` },
        { status: 200 }
      );
    } else {
      return NextResponse.json(
        { message: `${user.name} already in master sheet, approved!` },
        { status: 200 }
      );
    }
  } catch (error: any) {
    console.error("Approval mein error:", error.message, error.stack);
    return NextResponse.json(
      { message: `Server error: ${error.message}` },
      { status: 500 }
    );
  }
}
