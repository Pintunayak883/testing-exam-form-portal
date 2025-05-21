import MasterSheet, { IMasterSheet } from "@/models/MasterUser";
import User, { IUser } from "@/models/User";
import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";

// Common function to add user to master sheet
const addToMasterSheet = async (user: IUser): Promise<boolean> => {
  try {
    // Check if user exists with matching userId, email, and phone
    const exists = await MasterSheet.findOne({
      $or: [{ userId: user._id }, { email: user.email }, { phone: user.phone }],
    });

    if (!exists) {
      await MasterSheet.create({
        userId: user._id,
        name: user.name,
        email: user.email,
        password: user.password,
        dob: user.dob,
        phone: user.phone,
        area: user.area,
        landmark: user.landmark,
        address: user.address,
        examCityPreference1: user.examCityPreference1,
        examCityPreference2: user.examCityPreference2,
        previousCdaExperience: user.previousCdaExperience,
        cdaExperienceYears: user.cdaExperienceYears,
        cdaExperienceRole: user.cdaExperienceRole,
        photo: user.photo,
        signature: user.signature,
        thumbprint: user.thumbprint,
        aadhaarNo: user.aadhaarNo,
        penaltyClauseAgreement: user.penaltyClauseAgreement,
        fever: user.fever,
        cough: user.cough,
        breathlessness: user.breathlessness,
        soreThroat: user.soreThroat,
        otherSymptoms: user.otherSymptoms,
        otherSymptomsDetails: user.otherSymptomsDetails,
        closeContact: user.closeContact,
        covidDeclarationAgreement: user.covidDeclarationAgreement,
        accountHolderName: user.accountHolderName,
        bankName: user.bankName,
        ifsc: user.ifsc,
        branch: user.branch,
        bankAccountNo: user.bankAccountNo,
        currentDate: user.currentDate,
        sonOf: user.sonOf,
        resident: user.resident,
        role: user.role,
        status: user.status,
        approvedAt: new Date(),
        createdAt: user.createdAt,
      });
      console.log(`User ${user.name} added to master sheet`);
      return true;
    } else {
      console.log(
        `User ${user.name} already in master sheet with matching email and phone, skipping...`
      );
      return false;
    }
  } catch (error) {
    console.error("Master sheet add mein error:", error);
    throw error;
  }
};

// POST handler for populating master sheet
export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    console.log("Database connected successfully");

    const approvedUsers = await User.find({ status: "approve" });
    if (!approvedUsers || approvedUsers.length === 0) {
      return NextResponse.json(
        { message: "No approved users found" },
        { status: 404 }
      );
    }

    for (let user of approvedUsers) {
      // Validate required fields
      if (!user.email || !user.phone || !user.sonOf || !user.resident) {
        console.warn(
          `User ${user.name} has missing required fields, skipping...`
        );
        continue;
      }
      await addToMasterSheet(user);
    }
    return NextResponse.json(
      { message: "Master sheet population complete!" },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Arre, error aa gaya:", error.message, error.stack);
    return NextResponse.json(
      { message: `Server error: ${error.message}` },
      { status: 500 }
    );
  }
}

// GET handler for fetching master sheet
export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    console.log("Database connected successfully");

    const masterSheet = await MasterSheet.find();
    if (!masterSheet || masterSheet.length === 0) {
      return NextResponse.json(
        { message: "No records found in master sheet" },
        { status: 404 }
      );
    }
    return NextResponse.json(masterSheet, { status: 200 });
  } catch (error: any) {
    console.error("Master sheet fetch mein error:", error.message, error.stack);
    return NextResponse.json(
      { message: `Server error: ${error.message}` },
      { status: 500 }
    );
  }
}
