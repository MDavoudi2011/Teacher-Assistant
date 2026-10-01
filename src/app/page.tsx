"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Eye, Download, LogOut, FileText, LayoutDashboard } from "lucide-react";
import { loginAction } from "./actions";

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
    const { data, error } = await supabase
      .from('submissions')
      .select('*')
      .eq('class_name', activeClass)
      .order('created_at', { ascending: false });

    if (error) {
      console.error(error);
    } else {
      setSubmissions(data || []);
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
        <TabsList className="flex flex-wrap sm:flex-nowrap w-full h-auto items-center mb-8 gap-2 p-1.5 rounded-2xl sm:rounded-full bg-white shadow-sm border">
          {classes.map(cls => (
            <TabsTrigger key={cls} value={cls} className="flex-1 text-sm sm:text-base h-10 rounded-xl sm:rounded-full transition-all duration-300">
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
                      <TableHead className="text-right font-bold text-foreground py-4 px-6">نام و نام خانوادگی</TableHead>
                      <TableHead className="text-right font-bold text-foreground py-4">تاریخ ارسال</TableHead>
                      <TableHead className="text-left font-bold text-foreground py-4 px-6">عملیات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={3} className="h-32 text-center text-sm text-muted-foreground">
                          در حال بارگذاری
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
                          <TableCell className="text-base font-medium py-4 px-6">{sub.first_name} {sub.last_name}</TableCell>
                          <TableCell className="text-sm text-muted-foreground py-4 whitespace-nowrap">
                            {formatDate(sub.created_at)}
                          </TableCell>
                          <TableCell className="text-left py-4 px-6">
                            <div className="flex items-center justify-end gap-2">
                              <Button variant="ghost" size="icon" className="rounded-full hover:bg-primary/10 hover:text-primary transition-colors h-9 w-9" asChild>
                                <a href={sub.file_url} target="_blank" rel="noreferrer" title="مشاهده">
                                  <Eye className="h-5 w-5" />
                                </a>
                              </Button>
                              <Button variant="default" size="icon" className="rounded-full shadow-sm hover:shadow-md transition-all h-9 w-9" asChild>
                                <a href={sub.file_url} download title="دانلود">
                                  <Download className="h-4 w-4" />
                                </a>
                              </Button>
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
