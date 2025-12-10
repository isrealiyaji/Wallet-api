import prisma from "../config/database.js";

export const submitTier1KYC = async (req, res) => {
  try {
    const { bvn, dateOfBirth, address } = req.body;
    const userId = req.user.id;

    // Check if KYC already exists
    let kyc = await prisma.kYC.findUnique({
      where: { userId },
    });

    if (kyc) {
      // Update existing KYC
      kyc = await prisma.kYC.update({
        where: { userId },
        data: {
          bvn,
          dateOfBirth: new Date(dateOfBirth),
          address,
          level: "TIER1",
          status: "PENDING",
        },
      });
    } else {
      // Create new KYC
      kyc = await prisma.kYC.create({
        data: {
          userId,
          bvn,
          dateOfBirth: new Date(dateOfBirth),
          address,
          level: "TIER1",
          status: "PENDING",
        },
      });
    }

    res.status(200).json({
      success: true,
      message: "Tier 1 KYC submitted successfully",
      data: kyc,
    });
  } catch (error) {
    console.error("Submit Tier 1 KYC error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to submit KYC",
      error: error.message,
    });
  }
};


export const submitTier2KYC = async (req, res) => {
  try {
    const { idType, idNumber, idImageUrl } = req.body;
    const userId = req.user.id;

    // Check if Tier 1 is completed
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { kyc: true },
    });

    if (!user.kyc || user.kyc.level === "UNVERIFIED") {
      return res.status(400).json({
        success: false,
        message: "Please complete Tier 1 KYC first",
      });
    }

    // Update KYC
    const kyc = await prisma.kYC.update({
      where: { userId },
      data: {
        idType,
        idNumber,
        idImageUrl,
        level: "TIER2",
        status: "PENDING",
      },
    });

    res.status(200).json({
      success: true,
      message: "Tier 2 KYC submitted successfully",
      data: kyc,
    });
  } catch (error) {
    console.error("Submit Tier 2 KYC error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to submit KYC",
      error: error.message,
    });
  }
};


export const submitTier3KYC = async (req, res) => {
  try {
    const { utilityBillUrl, selfieUrl } = req.body;
    const userId = req.user.id;

    // Check if Tier 2 is completed
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { kyc: true },
    });

    if (!user.kyc || user.kycLevel !== "TIER2") {
      return res.status(400).json({
        success: false,
        message: "Please complete Tier 2 KYC first",
      });
    }

    // Update KYC
    const kyc = await prisma.kYC.update({
      where: { userId },
      data: {
        utilityBillUrl,
        selfieUrl,
        level: "TIER3",
        status: "PENDING",
      },
    });

    res.status(200).json({
      success: true,
      message: "Tier 3 KYC submitted successfully",
      data: kyc,
    });
  } catch (error) {
    console.error("Submit Tier 3 KYC error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to submit KYC",
      error: error.message,
    });
  }
};


export const getKYCStatus = async (req, res) => {
  try {
    const userId = req.user.id;

    const kyc = await prisma.kYC.findUnique({
      where: { userId },
    });

    if (!kyc) {
      return res.status(200).json({
        success: true,
        data: {
          level: "UNVERIFIED",
          status: "NOT_SUBMITTED",
        },
      });
    }

    res.status(200).json({
      success: true,
      data: kyc,
    });
  } catch (error) {
    console.error("Get KYC status error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get KYC status",
      error: error.message,
    });
  }
};


export const approveKYC = async (req, res) => {
  try {
    const { userId, level } = req.body;

    // Update KYC status
    const kyc = await prisma.$transaction(async (tx) => {
      const updatedKYC = await tx.kYC.update({
        where: { userId },
        data: {
          status: "APPROVED",
          verifiedAt: new Date(),
        },
      });

      // Update user KYC level
      await tx.user.update({
        where: { id: userId },
        data: { kycLevel: level },
      });

      return updatedKYC;
    });

    res.status(200).json({
      success: true,
      message: "KYC approved successfully",
      data: kyc,
    });
  } catch (error) {
    console.error("Approve KYC error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to approve KYC",
      error: error.message,
    });
  }
};


export const rejectKYC = async (req, res) => {
  try {
    const { userId, reason } = req.body;

    const kyc = await prisma.kYC.update({
      where: { userId },
      data: {
        status: "REJECTED",
        rejectionReason: reason,
      },
    });

    res.status(200).json({
      success: true,
      message: "KYC rejected",
      data: kyc,
    });
  } catch (error) {
    console.error("Reject KYC error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to reject KYC",
      error: error.message,
    });
  }
};

export default {
  submitTier1KYC,
  submitTier2KYC,
  submitTier3KYC,
  getKYCStatus,
  approveKYC,
  rejectKYC,
};
