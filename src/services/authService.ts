import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User, { IUser } from "../models/User";
import { AuthError, ValidationError } from "../utils/errors";
import { env } from "../config/env";

interface AuthResponse {
  user: {
    id: string;
    name: string;
    email: string;
    company?: string;
  };
  accessToken: string;
  refreshToken: string;
}

const generateTokens = (userId: string) => {
  const accessToken = jwt.sign({ userId }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as any,
  });

  const refreshToken = jwt.sign({ userId }, env.JWT_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN as any,
  });

  return { accessToken, refreshToken };
};

export const registerUser = async (data: Partial<IUser>): Promise<AuthResponse> => {
  const { name, email, password, company } = data;

  if (!name || !email || !password || !company) {
    throw new ValidationError("Eksik bilgi", {
      name: name ? [] : ["İsim zorunlu"],
      email: email ? [] : ["Email zorunlu"],
      password: password ? [] : ["Şifre zorunlu"],
      company: company ? [] : ["İşletme adı zorunlu"],
    });
  }

  // Email kontrolü
  const userExists = await User.findOne({ email });
  if (userExists) {
    throw new ValidationError("Bu email adresi zaten kullanılıyor", {
      email: ["Bu email adresi zaten kullanılıyor"],
    });
  }

  // Şifreyi hashle
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  // Kullanıcıyı oluştur
  const user = await User.create({
    name,
    email,
    password: hashedPassword,
    company,
  });

  const tokens = generateTokens(user._id.toString());

  return {
    user: {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      company: user.company,
    },
    ...tokens,
  };
};

export const loginUser = async (data: Partial<IUser>): Promise<AuthResponse> => {
  const { email, password } = data;

  if (!email || !password) {
    throw new ValidationError("Eksik bilgi", {
      email: email ? [] : ["Email zorunlu"],
      password: password ? [] : ["Şifre zorunlu"],
    });
  }

  const user = await User.findOne({ email });
  if (!user) {
    throw new AuthError("Geçersiz email veya şifre");
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new AuthError("Geçersiz email veya şifre");
  }

  const tokens = generateTokens(user._id.toString());

  return {
    user: {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      company: user.company,
    },
    ...tokens,
  };
};

export const refreshAccessToken = async (refreshToken: string): Promise<AuthResponse> => {
  if (!refreshToken) {
    throw new AuthError("Refresh token gerekli");
  }

  try {
    const decoded = jwt.verify(refreshToken, env.JWT_SECRET) as { userId: string };
    const user = await User.findById(decoded.userId);

    if (!user) {
      throw new AuthError("Geçersiz refresh token - kullanıcı bulunamadı");
    }

    const tokens = generateTokens(user._id.toString());

    return {
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        company: user.company,
      },
      ...tokens,
    };
  } catch (error) {
    throw new AuthError("Geçersiz veya süresi dolmuş refresh token");
  }
};
