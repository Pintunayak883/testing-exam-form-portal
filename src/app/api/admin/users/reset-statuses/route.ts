import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/User";
import { NextResponse } from "next/server";

export async function PUT(request: Request) {
  try {
    await connectToDatabase();

    // Sabke status ko pending pe reset karo
    await User.updateMany({}, { $set: { status: "pending" } });

    // Ab filtered users ko return karo — wahi jo form complete karke aaye hain
    const updatedUsers = await User.find({
      name: { $nin: [null, ""] },
      email: { $nin: [null, ""] },
      aadhaarNo: { $nin: [null, ""] },
      phone: { $nin: [null, ""] },
      address: { $nin: [null, ""] },
      examCityPreference1: { $nin: [null, ""] },
      photo: { $nin: [null, ""] },
      signature: { $nin: [null, ""] },
      penaltyClauseAgreement: true,
      covidDeclarationAgreement: true,
    })
      .sort({ updatedAt: -1 })
      .lean();

    return NextResponse.json(updatedUsers, { status: 200 });
  } catch (error) {
    console.error("Error resetting statuses:", error);
    return NextResponse.json(
      { error: "Failed to reset statuses" },
      { status: 500 }
    );
  }
}
