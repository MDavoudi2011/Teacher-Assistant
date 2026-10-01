"use client";

import { useState, useEffect } from "react";
import { Eye, Download, LogOut, FileText, LayoutDashboard } from "lucide-react";
import { loginAction, fetchSubmissionsAction } from "./actions";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toPersianDigits } from "@/lib/utils";

type Submission = {
  id: string;
  first_name: string;
  last_name: string;
  class_name: string;
  file_url: string;
  created_at: string;
};

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  
  const [activeClass, setActiveClass] = useState("9/1");
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState("");

  const classes = ["9/1", "9/2", "9/3", "9/4"];

  useEffect(() => {
    const auth = sessionStorage.getItem("adminAuth");
    if (auth === "true") {
      setIsLoggedIn(true);
    }
  }, []);

  useEffect(() => {
    if (isLoggedIn) {
      fetchSubmissions();
    }
  }, [activeClass, isLoggedIn]);

  const fetchSubmissions = async () => {
    setLoading(true);
    setFetchError("");
    const res = await fetchSubmissionsAction(activeClass);

    if (res.error) {
      console.error(res.error);
      setFetchError(res.error);
    } else {
      setSubmissions(res.data || []);
    }
    setLoading(false);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await loginAction(password);
    setLoading(false);
    
    if (res.success) {
      setIsLoggedIn(true);
      sessionStorage.setItem("adminAuth", "true");
    } else {
      setError(res.error || "خطا در ورود");
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    sessionStorage.removeItem("adminAuth");
  };

  const formatDate = (dateString: string) => {
    const d = new Date(dateString);
    const datePart = d.toLocaleDateString('fa-IR', {
      day: 'numeric',
      month: 'long',
    });
    const timePart = d.toLocaleTimeString('fa-IR', {
      hour: '2-digit',
      minute: '2-digit'
    });
    return `${datePart} - ساعت ${timePart}`;
  };

  if (!isLoggedIn) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4 bg-muted/30" dir="rtl">
        <Card className="w-full max-w-sm shadow-xl border-0 ring-1 ring-border/50">
          <CardHeader className="text-center pb-8 pt-8">
            <div className="mx-auto bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mb-6">
              <LayoutDashboard className="w-8 h-8 text-primary" />
            </div>
            <CardTitle className="text-2xl font-bold text-foreground">ورود به سامانه</CardTitle>
            <CardDescription className="text-base mt-2">برای مدیریت تکالیف رمز عبور خود را وارد کنید</CardDescription>
          </CardHeader>
          <CardContent className="pb-8">
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2">
                <Input
                  type="password"
                  placeholder="رمز عبور"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="text-center h-12 text-lg rounded-full"
                  dir="ltr"
                />
              </div>
              {error && <p className="text-sm text-destructive text-center font-medium">{error}</p>}
              <Button type="submit" className="w-full h-12 rounded-full text-lg shadow-lg shadow-primary/30" disabled={loading}>
                {loading ? "در حال بررسی" : "ورود"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-5xl mx-auto py-8 px-4" dir="rtl">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-extrabold tracking-tight text-primary">داشبورد تکالیف</h1>
        <Button variant="outline" size="sm" onClick={handleLogout} className="rounded-full shadow-sm hover:bg-destructive hover:text-destructive-foreground hover:border-destructive transition-colors text-sm px-4">
          <LogOut className="ml-2 h-4 w-4" />
          خروج
        </Button>
      </div>

      <Tabs defaultValue="9/1" className="w-full" onValueChange={setActiveClass} dir="rtl">
        <TabsList className="grid grid-cols-4 w-full h-auto mb-8 gap-1 p-1 rounded-full bg-white shadow-sm border overflow-hidden">
          {classes.map(cls => (
            <TabsTrigger key={cls} value={cls} className="text-sm sm:text-base md:text-lg h-11 rounded-full transition-all duration-300 font-medium">
              کلاس {toPersianDigits(cls)}
            </TabsTrigger>
          ))}
        </TabsList>

        {classes.map(cls => (
          <TabsContent key={cls} value={cls} className="mt-0">
            <Card className="shadow-lg border-0 ring-1 ring-border/50 overflow-hidden rounded-2xl">
              <CardContent className="p-0">
                <Table>
                  <TableHeader className="bg-secondary/30">
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="text-right font-bold text-foreground py-3 px-3 sm:px-6 w-full min-w-[150px]">نام و نام خانوادگی</TableHead>
                      <TableHead className="text-right font-bold text-foreground py-3 px-3 sm:px-6 whitespace-nowrap w-[120px]">تاریخ ارسال</TableHead>
                      <TableHead className="text-center font-bold text-foreground py-3 px-3 sm:px-6 whitespace-nowrap w-[100px]">عملیات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {fetchError ? (
                      <TableRow>
                        <TableCell colSpan={3} className="h-32 text-center text-sm text-destructive">
                          خطا در ارتباط با دیتابیس (بررسی کنید که متغیرهای Vercel را دقیق وارد کرده باشید):<br/>
                          {fetchError}
                        </TableCell>
                      </TableRow>
                    ) : loading ? (
                      <TableRow>
                        <TableCell colSpan={3} className="h-32 text-center text-sm text-muted-foreground">
                          در حال بارگذاری...
                        </TableCell>
                      </TableRow>
                    ) : submissions.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} className="h-48 text-center text-muted-foreground">
                          <div className="flex flex-col items-center justify-center gap-3">
                            <div className="w-14 h-14 rounded-full bg-secondary flex items-center justify-center">
                              <FileText className="h-6 w-6 text-primary/60" />
                            </div>
                            <span className="text-base">تکلیفی ارسال نشده است</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      submissions.map((sub) => (
                        <TableRow key={sub.id} className="transition-colors hover:bg-muted/30">
                          <TableCell className="text-sm sm:text-base font-medium py-3 px-3 sm:px-6 whitespace-nowrap">{sub.first_name} {sub.last_name}</TableCell>
                          <TableCell className="text-xs sm:text-sm text-muted-foreground py-3 px-3 sm:px-6 whitespace-nowrap">
                            {formatDate(sub.created_at)}
                          </TableCell>
                          <TableCell className="text-center py-3 px-3 sm:px-6">
                            <div className="flex items-center justify-center">
                              <div className="flex bg-muted/50 rounded-full border shadow-sm overflow-hidden">
                                <a href={sub.file_url} target="_blank" rel="noopener noreferrer" title="مشاهده" className="flex-1 flex items-center justify-center h-9 px-3 hover:bg-blue-100 hover:text-blue-600 transition-colors border-l">
                                  <Eye className="h-4 w-4" />
                                </a>
                                <a href={sub.file_url} download title="دانلود" className="flex-1 flex items-center justify-center h-9 px-3 hover:bg-emerald-100 hover:text-emerald-600 transition-colors">
                                  <Download className="h-4 w-4" />
                                </a>
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
