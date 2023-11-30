import { deleteStripeCustomer } from "@calcom/app-store/stripepayment/lib/customer";
import { ErrorCode } from "@calcom/features/auth/lib/ErrorCode";
import { verifyPassword } from "@calcom/features/auth/lib/verifyPassword";
import { symmetricDecrypt } from "@calcom/lib/crypto";
import { deleteWebUser as syncServicesDeleteWebUser } from "@calcom/lib/sync/SyncServiceManager";
import { prisma } from "@calcom/prisma";
import { IdentityProvider } from "@calcom/prisma/enums";
import type { TrpcSessionUser } from "@calcom/trpc/server/trpc";

import type { TDeleteMeInputSchema } from "./deleteMe.schema";

type DeleteMeOptions = {
  ctx: {
    user: NonNullable<TrpcSessionUser>;
  };
  input: TDeleteMeInputSchema;
};

export const deleteMeHandler = async ({ ctx, input }: DeleteMeOptions) => {
  // Check if input.password is correct
  const user = await prisma.user.findUnique({
    where: {
      email: ctx.user.email.toLowerCase(),
    },
  });
  if (!user) {
    throw new Error(ErrorCode.UserNotFound);
  }

  // If 2FA is disabled or totpCode is valid then delete the user from stripe and database
  await deleteStripeCustomer(user).catch(console.warn);
  // Remove my account
  const deletedUser = await prisma.user.delete({
    where: {
      id: ctx.user.id,
    },
  });

  // Sync Services
  syncServicesDeleteWebUser(deletedUser);
  return;
};
