import NextAuth from "next-auth";
import { authOptions } from "@/app/lib/auth"; // Importa do novo arquivo

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
