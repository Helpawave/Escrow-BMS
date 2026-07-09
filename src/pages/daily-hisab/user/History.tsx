/* eslint-disable @typescript-eslint/no-explicit-any */
// History.tsx
import { UserLayout } from "@/components/layout/UserLayout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { useFinance } from "@/contexts/FinanceContext";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import {
  History as HistoryIcon,
  TrendingUp,
  TrendingDown,
  Calendar,
  Clock,
  Filter,
  Search,
  Trash2,
  Download,
  Eye,
} from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import html2canvas from "html2canvas";

export const History = () => {
  const { user } = useAuth();
  const { getUserEntries, deleteEntry } = useFinance();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [viewingEntry, setViewingEntry] = useState<any>(null);

  const entries = user ? getUserEntries(user.id) : [];

  // Calculate correct difference for each entry (today hisab - previous hisab)
  const entriesWithCorrectDifference = entries.map((entry, index) => {
    // Get the previous entry (chronologically previous - next index since newest first)
    const previousEntry = entries[index + 1];
    const previousHisab = previousEntry?.todayHisab || 0;

    // For the first entry (oldest), difference should be 0
    const correctDifference = previousEntry ? entry.todayHisab - previousHisab : 0;

    // Debug log for first entry
    if (index === entries.length - 1) {
      console.log('[HISTORY] First entry (oldest):', {
        date: entry.date,
        time: entry.time,
        todayHisab: entry.todayHisab,
        previousEntry: previousEntry,
        previousHisab: previousHisab,
        calculatedDifference: correctDifference,
        isFirstEntry: !previousEntry
      });
    }

    return {
      ...entry,
      difference: correctDifference
    };
  });

  const filteredEntries = entriesWithCorrectDifference.filter((entry) => {
    const matchesSearch =
      !searchTerm ||
      entry.date.includes(searchTerm) ||
      entry.todayHisab.toString().includes(searchTerm);

    const matchesDate = !selectedDate || entry.date === selectedDate;

    return matchesSearch && matchesDate;
  });

  const totalEntries = filteredEntries.length;
  const profitableEntries = filteredEntries.filter(
    (entry) => entry.todayHisab > 0
  ).length;
  const totalProfit = filteredEntries
    .filter((entry) => entry.todayHisab > 0)
    .reduce((sum, entry) => sum + entry.todayHisab, 0);
  const totalLoss = filteredEntries
    .filter((entry) => entry.todayHisab < 0)
    .reduce((sum, entry) => sum + Math.abs(entry.todayHisab), 0);



  const handleDeleteEntry = (id: string) => {
    deleteEntry(id);
    toast({
      title: "Entry deleted!",
      description: "The calculation has been removed from your history",
    });
  };

  // Helper to format arrays for PDF
  const formatArrayForPDF = (arr: any[], type: "name" | "desc" = "name") => {
    if (!arr || arr.length === 0) return "-";
    return arr.map((item) => `${item[type]}: ${item.value}`).join(", ");
  };

  const handleDownloadPDF = () => {
    const doc = new jsPDF({
      orientation: 'landscape', // Landscape for more width
      unit: 'mm',
      format: 'a4'
    });

    // Add logo image
    try {
      // Create image element to load logo
      const img = new Image();
      img.onload = function () {
        // Add logo to PDF (close positioning with ESCOCALC)
        const logoSize = 15; // Logo size
        const logoX = 120; // Logo position
        const textX = logoX + logoSize + 5; // Text starts 5mm after logo ends
        const baselineY = 15; // Common baseline for both logo and text

        // Add logo aligned to baseline
        doc.addImage(img, 'PNG', logoX, baselineY - logoSize + 3, logoSize, logoSize);

        // Continue with rest of PDF generation
        generatePDFContent(textX, baselineY);
      };
      img.src = '/logo.png';
    } catch (error) {
      console.log('Logo loading failed, continuing without logo');
      generatePDFContent();
    }

    function generatePDFContent(textX = 148, baselineY = 15) {
      // Logo and Company Header (Properly aligned)
      doc.setFontSize(20);
      doc.setFont("helvetica", "bold");
      doc.text("ESCOCALC", textX, baselineY, { align: 'left' }); // Aligned to same baseline as logo

      doc.setFontSize(14);
      doc.setFont("helvetica", "normal");
      doc.text(`Company Name: ${user?.companyName || 'ESCOCALC'}`, 148, baselineY + 15, { align: 'center' });

      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text("Financial History Report", 148, baselineY + 25, { align: 'center' });

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(`Generated on: ${new Date().toLocaleString()}`, 148, baselineY + 35, { align: 'center' });
      doc.text(`Report Period: ${filteredEntries.length > 0 ? `${filteredEntries[filteredEntries.length - 1]?.date} to ${filteredEntries[0]?.date}` : 'No entries'}`, 148, baselineY + 42, { align: 'center' });

      let yPos = baselineY + 60;

      // Summary Statistics as Cards (Landscape layout)
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("SUMMARY STATISTICS", 148, yPos, { align: 'center' });
      yPos += 15;

      // Card 1: Total Entries (Better spacing to avoid overlap)
      doc.setFillColor(219, 234, 254); // Light blue background
      doc.rect(15, yPos, 60, 18, 'F');
      doc.setDrawColor(59, 130, 246);
      doc.rect(15, yPos, 60, 18);
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(0, 0, 0); // Black text
      doc.text("Total Entries", 45, yPos + 7, { align: 'center' });
      doc.setFontSize(14);
      doc.setTextColor(59, 130, 246);
      doc.text(`${totalEntries}`, 45, yPos + 14, { align: 'center' });

      // Card 2: Profitable Days
      doc.setTextColor(0, 0, 0);
      doc.setFillColor(220, 252, 231); // Light green background
      doc.rect(85, yPos, 60, 18, 'F');
      doc.setDrawColor(34, 197, 94);
      doc.rect(85, yPos, 60, 18);
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(0, 0, 0); // Black text
      doc.text("Profitable Days", 115, yPos + 7, { align: 'center' });
      doc.setFontSize(12);
      doc.setTextColor(34, 197, 94);
      doc.text(`${profitableEntries} (${totalEntries > 0 ? Math.round((profitableEntries / totalEntries) * 100) : 0}%)`, 115, yPos + 14, { align: 'center' });

      // Card 3: Total Profit
      doc.setTextColor(0, 0, 0);
      doc.setFillColor(220, 252, 231); // Light green background
      doc.rect(155, yPos, 60, 18, 'F');
      doc.setDrawColor(34, 197, 94);
      doc.rect(155, yPos, 60, 18);
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(0, 0, 0); // Black text
      doc.text("Total Profit", 185, yPos + 7, { align: 'center' });
      doc.setFontSize(12);
      doc.setTextColor(34, 197, 94);
      doc.text(`${totalProfit}`, 185, yPos + 14, { align: 'center' });

      // Card 4: Total Loss
      doc.setTextColor(0, 0, 0);
      doc.setFillColor(254, 226, 226); // Light red background
      doc.rect(225, yPos, 60, 18, 'F');
      doc.setDrawColor(239, 68, 68);
      doc.rect(225, yPos, 60, 18);
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(0, 0, 0); // Black text
      doc.text("Total Loss", 255, yPos + 7, { align: 'center' });
      doc.setFontSize(12);
      doc.setTextColor(239, 68, 68);
      doc.text(`${totalLoss}`, 255, yPos + 14, { align: 'center' });

      yPos += 40;

      // Clean table with only totals (no individual names/amounts)
      const tableData = filteredEntries.map((entry) => [
        entry.date,
        entry.time,
        String(entry.A), // Client Balance total - simple string
        String(entry.C), // Upline total  
        String(entry.A1), // Bank Balance total
        String(entry.B1), // RTGS total
        String(entry.C1), // Expenses total
        String(entry.sumX), // Coin Report
        String(entry.sumY), // Fund Report
        String(entry.todayHisab), // Today's Hisab
        String(entry.difference || 0), // Difference
      ]);

      autoTable(doc, {
        head: [
          [
            "Date",
            "Time",
            "Client Balance",
            "Upline",
            "Bank Balance",
            "RTGS",
            "Extra Expenses",
            "Coin Report",
            "Fund Report",
            "Today's Hisab",
            "Difference",
          ],
        ],
        body: tableData,
        startY: yPos,
        styles: {
          fontSize: 7,
          cellPadding: 1,
          lineColor: [200, 200, 200],
          lineWidth: 0.1,
          halign: 'center',
          font: 'helvetica',
          fontStyle: 'normal',
          overflow: 'linebreak',
          cellWidth: 'wrap'
        },
        headStyles: {
          fillColor: [41, 128, 185],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 7,
          halign: 'center',
          font: 'helvetica',
          cellPadding: 1
        },
        columnStyles: {
          0: { cellWidth: 25 }, // Date
          1: { cellWidth: 20 }, // Time
          2: { cellWidth: 25, halign: 'right' }, // Client
          3: { cellWidth: 20, halign: 'right' }, // Upline
          4: { cellWidth: 25, halign: 'right' }, // Bank
          5: { cellWidth: 20, halign: 'right' }, // RTGS
          6: { cellWidth: 25, halign: 'right' }, // Expenses
          7: { cellWidth: 25, halign: 'right' }, // Coin Report
          8: { cellWidth: 25, halign: 'right' }, // Fund Report
          9: { cellWidth: 25, halign: 'right' }, // Today's Hisab
          10: { cellWidth: 25, halign: 'right' }, // Difference
        },
        margin: { left: 15, right: 15 }, // Centered margins
        tableWidth: 'auto',
        didParseCell: function (data) {
          // Color coding for Today's Hisab
          if (data.column.index === 9) { // Today's Hisab column
            const cellText = data.cell.text[0] || '';
            const value = parseFloat(cellText.replace('₹', '').replace(',', ''));
            if (value >= 0) {
              data.cell.styles.textColor = [34, 197, 94]; // Green
            } else {
              data.cell.styles.textColor = [239, 68, 68]; // Red
            }
          }
          // Color coding for Difference
          if (data.column.index === 10) { // Difference column
            const cellText = data.cell.text[0] || '';
            const value = parseFloat(cellText.replace('₹', '').replace(',', ''));
            if (value >= 0) {
              data.cell.styles.textColor = [34, 197, 94]; // Green
            } else {
              data.cell.styles.textColor = [239, 68, 68]; // Red
            }
          }
        }
      });

      doc.save(`${user?.companyName || 'ESCOCALC'}-financial-history-${new Date().toISOString().split("T")[0]}.pdf`);

      toast({
        title: "Professional PDF Downloaded!",
        description: "Clean financial history report with logo and summary cards generated successfully",
      });
    }
  };


  const handleDownloadSinglePDF = (entry: any) => {
    const doc = new jsPDF({
      orientation: 'portrait', // Portrait for single page fit
      unit: 'mm',
      format: 'a4'
    });

    // Add logo and company header like main PDF
    try {
      const img = new Image();
      img.onload = function () {
        // Add logo to PDF (portrait center = 105)
        const logoSize = 10; // Smaller logo
        const logoX = 80;
        const textX = logoX + logoSize + 5;
        const baselineY = 12; // Common baseline for both logo and text

        // Add logo aligned to baseline
        doc.addImage(img, 'PNG', logoX, baselineY - logoSize + 2, logoSize, logoSize);

        // Logo and Company Header - aligned to same baseline
        doc.setFontSize(14); // Smaller font
        doc.setFont("helvetica", "bold");
        doc.text("ESCOCALC", textX, baselineY, { align: 'left' });

        doc.setFontSize(10); // Smaller font
        doc.setFont("helvetica", "normal");
        doc.text(`Company Name: ${user?.companyName || 'ESCOCALC'}`, 105, baselineY + 10, { align: 'center' });

        generateModalReplicaPDF();
      };
      img.src = '/logo.png';
    } catch (error) {
      console.log('Logo loading failed, continuing without logo');
      generateModalReplicaPDF();
    }

    function generateModalReplicaPDF() {
      // Helper function to check page break
      const checkPageBreak = (requiredSpace: number) => {
        const pageHeight = doc.internal.pageSize.getHeight();
        if (yPos + requiredSpace > pageHeight - 20) { // 20mm margin from bottom
          doc.addPage();

          // Add header to new page
          doc.setFontSize(12);
          doc.setFont("helvetica", "bold");
          doc.text("ESCOCALC", 105, 15, { align: 'center' });
          doc.setFontSize(10);
          doc.setFont("helvetica", "normal");
          doc.text(`Company Name: ${user?.companyName || 'ESCOCALC'}`, 105, 22, { align: 'center' });
          doc.text(`Transaction Details - ${entry.date} at ${entry.time} (Continued)`, 105, 32, { align: 'center' });

          yPos = 45; // Reset yPos for new page
        }
      };

      // Modal Header - Transaction Details (portrait center = 105)
      doc.setFontSize(10); // Even smaller font
      doc.setFont("helvetica", "bold");
      doc.text(`Transaction Details - ${entry.date} at ${entry.time}`, 105, 30, { align: 'center' });

      let yPos = 35; // Start lower to give more space

      // Check space for Income Sources section
      checkPageBreak(40); // Much smaller estimate for compact layout

      // Income Sources Section (Spread Layout)
      doc.setFontSize(11); // Slightly bigger font
      doc.setFont("helvetica", "bold");
      doc.setTextColor(37, 99, 235); // Blue color like modal
      doc.text("Income Sources", 15, yPos);
      doc.setTextColor(0, 0, 0);
      yPos += 12; // More spacing for spread look

      // Two column layout for portrait (Client Balance | Upline) - Spread layout
      const leftColX = 15;
      const rightColX = 110;
      const colWidth = 80; // Slightly bigger width

      // Client Balance (Left Column)
      doc.setFontSize(10); // Bigger font
      doc.setFont("helvetica", "bold");
      doc.text("Client Balance", leftColX, yPos);

      // Total amount in blue box - bigger
      doc.setFillColor(219, 234, 254);
      doc.rect(leftColX + 55, yPos - 7, 25, 10, 'F'); // Bigger box
      doc.setDrawColor(59, 130, 246);
      doc.rect(leftColX + 55, yPos - 7, 25, 10);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9); // Bigger font
      doc.text(`${entry.A}`, leftColX + 67.5, yPos - 2, { align: 'center' });

      // Upline (Right Column)
      doc.setFontSize(10); // Bigger font
      doc.setFont("helvetica", "bold");
      doc.text("Upline", rightColX, yPos);

      // Total amount in blue box - bigger
      doc.setFillColor(219, 234, 254);
      doc.rect(rightColX + 35, yPos - 7, 25, 10, 'F'); // Bigger box
      doc.setDrawColor(59, 130, 246);
      doc.rect(rightColX + 35, yPos - 7, 25, 10);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9); // Bigger font
      doc.text(`${entry.C}`, rightColX + 47.5, yPos - 2, { align: 'center' });

      yPos += 15; // More spacing

      // Client entries table (Left) - More compact
      if (entry.clients && entry.clients.length > 0) {
        // Header row - smaller
        doc.setFillColor(248, 250, 252); // Very light gray
        doc.rect(leftColX, yPos, colWidth, 6, 'F'); // Smaller height
        doc.setFontSize(7); // Smaller font
        doc.setFont("helvetica", "bold");
        doc.text("Client Name", leftColX + 3, yPos + 4);
        doc.text("Amount", leftColX + colWidth - 3, yPos + 4, { align: 'right' });
        yPos += 6; // Less spacing

        // Data rows - more compact
        entry.clients.forEach((client: any, i: number) => {
          if (i % 2 === 0) {
            doc.setFillColor(255, 255, 255); // Pure white for alternating rows
            doc.rect(leftColX, yPos, colWidth, 4, 'F'); // Smaller height
          }
          doc.setFont("helvetica", "normal");
          doc.setFontSize(6); // Much smaller font
          doc.text(`${client.name}`, leftColX + 3, yPos + 3);
          doc.setTextColor(37, 99, 235);
          doc.text(`${client.value}`, leftColX + colWidth - 3, yPos + 3, { align: 'right' });
          doc.setTextColor(0, 0, 0);
          yPos += 4; // Less spacing
        });
      }

      // Reset yPos for upline (right column)
      let uplineYPos = yPos - (entry.clients ? entry.clients.length * 6 + 8 : 0);

      // Upline entries table (Right)
      if (entry.uplines && entry.uplines.length > 0) {
        // Header row
        doc.setFillColor(248, 250, 252); // Very light gray
        doc.rect(rightColX, uplineYPos, colWidth, 8, 'F');
        doc.setFontSize(9);
        doc.setFont("helvetica", "bold");
        doc.text("Source Name", rightColX + 5, uplineYPos + 5);
        doc.text("Amount", rightColX + colWidth - 5, uplineYPos + 5, { align: 'right' });
        uplineYPos += 8;

        // Data rows
        entry.uplines.forEach((upline: any, i: number) => {
          if (i % 2 === 0) {
            doc.setFillColor(255, 255, 255); // Pure white for alternating rows
            doc.rect(rightColX, uplineYPos, colWidth, 6, 'F');
          }
          doc.setFont("helvetica", "normal");
          doc.setFontSize(8);
          doc.text(`${upline.name}`, rightColX + 5, uplineYPos + 4);
          doc.setTextColor(37, 99, 235);
          doc.text(`${upline.value}`, rightColX + colWidth - 5, uplineYPos + 4, { align: 'right' });
          doc.setTextColor(0, 0, 0);
          uplineYPos += 6;
        });
      }

      // Use the max yPos from both columns - more spacing for spread
      yPos = Math.max(yPos, uplineYPos) + 15;

      // Check space for Expenses section
      checkPageBreak(50); // Much smaller estimate for compact layout

      // Expenses & Transfers Section (Spread Layout)
      doc.setFontSize(11); // Bigger font
      doc.setFont("helvetica", "bold");
      doc.setTextColor(34, 197, 94); // Green color like modal
      doc.text("Expenses & Transfers", 15, yPos);
      doc.setTextColor(0, 0, 0);
      yPos += 12; // More spacing for spread

      // 3-Column layout for portrait: Bank Balance | Upar Jama/RTGS | Extra Expenses - Better spacing
      const expenseCol1X = 15;
      const expenseCol2X = 75;
      const expenseCol3X = 135;
      const expenseColWidth = 50; // Optimized width

      // Bank Balance (Column 1) - More compact
      doc.setFontSize(8); // Much smaller font
      doc.setFont("helvetica", "bold");
      doc.text("Bank Balance", expenseCol1X, yPos);
      doc.setFillColor(220, 252, 231);
      doc.rect(expenseCol1X + 30, yPos - 5, 18, 6, 'F'); // Much smaller box
      doc.setDrawColor(34, 197, 94);
      doc.rect(expenseCol1X + 30, yPos - 5, 18, 6);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7); // Much smaller font
      doc.text(`${entry.A1}`, expenseCol1X + 39, yPos - 1, { align: 'center' });

      // Upar Jama / RTGS (Column 2) - Portrait spacing
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text("Upar Jama / RTGS", expenseCol2X, yPos);
      doc.setFillColor(220, 252, 231);
      doc.rect(expenseCol2X + 35, yPos - 6, 20, 8, 'F'); // Smaller box
      doc.setDrawColor(34, 197, 94);
      doc.rect(expenseCol2X + 35, yPos - 6, 20, 8);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.text(`${entry.B1}`, expenseCol2X + 45, yPos - 1, { align: 'center' });

      // Extra Expenses (Column 3) - Portrait spacing
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text("Extra Expenses", expenseCol3X, yPos);
      doc.setFillColor(220, 252, 231);
      doc.rect(expenseCol3X + 30, yPos - 6, 20, 8, 'F'); // Smaller box
      doc.setDrawColor(34, 197, 94);
      doc.rect(expenseCol3X + 30, yPos - 6, 20, 8);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.text(`${entry.C1}`, expenseCol3X + 40, yPos - 1, { align: 'center' });

      yPos += 12;

      // Tables below each column (same as Income Sources style)
      const expenseTableStartY = yPos;
      let bankYPos = expenseTableStartY;
      let rtgsYPos = expenseTableStartY;
      let expenseYPos = expenseTableStartY;

      // Bank entries table (Column 1)
      if (entry.banks && entry.banks.length > 0) {
        doc.setFillColor(248, 250, 252);
        doc.rect(expenseCol1X, bankYPos, expenseColWidth, 8, 'F');
        doc.setFontSize(8);
        doc.setFont("helvetica", "bold");
        doc.text("Bank/Account", expenseCol1X + 3, bankYPos + 5);
        doc.text("Amount", expenseCol1X + expenseColWidth - 3, bankYPos + 5, { align: 'right' });
        bankYPos += 8;

        entry.banks.forEach((bank: any, i: number) => {
          if (i % 2 === 0) {
            doc.setFillColor(255, 255, 255);
            doc.rect(expenseCol1X, bankYPos, expenseColWidth, 6, 'F');
          }
          doc.setFont("helvetica", "normal");
          doc.setFontSize(7);
          doc.text(`${bank.name}`, expenseCol1X + 3, bankYPos + 4);
          doc.setTextColor(34, 197, 94);
          doc.text(`${bank.value}`, expenseCol1X + expenseColWidth - 3, bankYPos + 4, { align: 'right' });
          doc.setTextColor(0, 0, 0);
          bankYPos += 6;
        });
      }

      // RTGS entries table (Column 2)
      if (entry.rtgs && entry.rtgs.length > 0) {
        doc.setFillColor(248, 250, 252);
        doc.rect(expenseCol2X, rtgsYPos, expenseColWidth, 8, 'F');
        doc.setFontSize(8);
        doc.setFont("helvetica", "bold");
        doc.text("Transfer Description", expenseCol2X + 3, rtgsYPos + 5);
        doc.text("Amount", expenseCol2X + expenseColWidth - 3, rtgsYPos + 5, { align: 'right' });
        rtgsYPos += 8;

        entry.rtgs.forEach((rtgs: any, i: number) => {
          if (i % 2 === 0) {
            doc.setFillColor(255, 255, 255);
            doc.rect(expenseCol2X, rtgsYPos, expenseColWidth, 6, 'F');
          }
          doc.setFont("helvetica", "normal");
          doc.setFontSize(7);
          doc.text(`${rtgs.desc}`, expenseCol2X + 3, rtgsYPos + 4);
          doc.setTextColor(34, 197, 94);
          doc.text(`${rtgs.value}`, expenseCol2X + expenseColWidth - 3, rtgsYPos + 4, { align: 'right' });
          doc.setTextColor(0, 0, 0);
          rtgsYPos += 6;
        });
      }

      // Extra Expenses table (Column 3)
      if (entry.expenses && entry.expenses.length > 0) {
        doc.setFillColor(248, 250, 252);
        doc.rect(expenseCol3X, expenseYPos, expenseColWidth, 8, 'F');
        doc.setFontSize(8);
        doc.setFont("helvetica", "bold");
        doc.text("Expense Description", expenseCol3X + 3, expenseYPos + 5);
        doc.text("Amount", expenseCol3X + expenseColWidth - 3, expenseYPos + 5, { align: 'right' });
        expenseYPos += 8;

        entry.expenses.forEach((expense: any, i: number) => {
          if (i % 2 === 0) {
            doc.setFillColor(255, 255, 255);
            doc.rect(expenseCol3X, expenseYPos, expenseColWidth, 6, 'F');
          }
          doc.setFont("helvetica", "normal");
          doc.setFontSize(7);
          doc.text(`${expense.desc}`, expenseCol3X + 3, expenseYPos + 4);
          doc.setTextColor(34, 197, 94);
          doc.text(`${expense.value}`, expenseCol3X + expenseColWidth - 3, expenseYPos + 4, { align: 'right' });
          doc.setTextColor(0, 0, 0);
          expenseYPos += 6;
        });
      }

      // Use max yPos from all three columns - more spacing for spread
      yPos = Math.max(bankYPos, rtgsYPos, expenseYPos) + 15;

      // Check space for Calculation Summary
      checkPageBreak(30); // Much smaller estimate for very compact summary

      // Calculation Summary (Modal Layout) - Portrait Compact
      yPos += 5; // Less spacing
      doc.setFontSize(12); // Smaller font
      doc.setFont("helvetica", "bold");
      doc.text("Calculation Summary", 105, yPos, { align: 'center' });
      yPos += 12; // Less spacing

      const modalBoxWidth = 60; // Bigger boxes for spread look
      const modalBoxHeight = 15; // Bigger height
      const modalSpacing = 10; // More spacing

      // Row 1: Coin Report and Fund Report (Portrait centered)
      const summaryStartX = (210 - (modalBoxWidth * 2 + modalSpacing)) / 2; // Properly centered

      // Coin Report (Blue)
      doc.setFillColor(219, 234, 254);
      doc.rect(summaryStartX, yPos, modalBoxWidth, modalBoxHeight, 'F');
      doc.setDrawColor(59, 130, 246);
      doc.rect(summaryStartX, yPos, modalBoxWidth, modalBoxHeight);
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(0, 0, 0);
      doc.text("Coin Report", summaryStartX + modalBoxWidth / 2, yPos + 5, { align: 'center' });
      doc.setFontSize(7);
      doc.text("(Total Income)", summaryStartX + modalBoxWidth / 2, yPos + 9, { align: 'center' });
      doc.setFontSize(12);
      doc.setTextColor(37, 99, 235);
      doc.text(`${entry.sumX}`, summaryStartX + modalBoxWidth / 2, yPos + 13, { align: 'center' });

      // Fund Report (Green)
      doc.setTextColor(0, 0, 0);
      doc.setFillColor(220, 252, 231);
      doc.rect(summaryStartX + modalBoxWidth + modalSpacing, yPos, modalBoxWidth, modalBoxHeight, 'F');
      doc.setDrawColor(34, 197, 94);
      doc.rect(summaryStartX + modalBoxWidth + modalSpacing, yPos, modalBoxWidth, modalBoxHeight);
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.text("Fund Report", summaryStartX + modalBoxWidth + modalSpacing + modalBoxWidth / 2, yPos + 5, { align: 'center' });
      doc.setFontSize(7);
      doc.text("(Total Expenses)", summaryStartX + modalBoxWidth + modalSpacing + modalBoxWidth / 2, yPos + 9, { align: 'center' });
      doc.setFontSize(12);
      doc.setTextColor(34, 197, 94);
      doc.text(`${entry.sumY}`, summaryStartX + modalBoxWidth + modalSpacing + modalBoxWidth / 2, yPos + 13, { align: 'center' });

      yPos += modalBoxHeight + 15;

      // Row 2: Difference Card - Full Width (Spread height)
      const fullWidth = modalBoxWidth * 2 + modalSpacing;
      const thinnerHeight = 12; // Slightly bigger height for spread look

      // Purple Difference Card
      doc.setTextColor(0, 0, 0);
      doc.setFillColor(248, 243, 255); // Light purple background
      doc.rect(summaryStartX, yPos, fullWidth, thinnerHeight, 'F');
      doc.setDrawColor(147, 51, 234); // Purple border
      doc.rect(summaryStartX, yPos, fullWidth, thinnerHeight);
      doc.setFontSize(8); // Font for label
      doc.setFont("helvetica", "bold");
      doc.text("Difference:", summaryStartX + 8, yPos + 8, { align: 'left' });
      doc.setFontSize(10); // Font for amount
      if ((entry.difference || 0) >= 0) {
        doc.setTextColor(147, 51, 234); // Purple for positive
      } else {
        doc.setTextColor(147, 51, 234); // Purple for negative
      }
      doc.text(`${entry.difference || 0}`, summaryStartX + fullWidth / 2, yPos + 8, { align: 'center' });

      yPos += thinnerHeight + 10;

      // Row 3: Today's Hisab - Full Width (Spread layout)
      doc.setTextColor(0, 0, 0);
      doc.setFillColor(248, 250, 252);
      doc.rect(summaryStartX, yPos, fullWidth, thinnerHeight + 8, 'F'); // Bigger height for spread
      doc.setDrawColor(148, 163, 184);
      doc.rect(summaryStartX, yPos, fullWidth, thinnerHeight + 8);
      doc.setFontSize(8); // Font for label
      doc.setFont("helvetica", "bold");
      doc.text("Today's Hisab:", summaryStartX + 8, yPos + 12, { align: 'left' });
      doc.setFontSize(10); // Font for amount
      if (entry.todayHisab >= 0) {
        doc.setTextColor(34, 197, 94);
      } else {
        doc.setTextColor(239, 68, 68);
      }
      doc.text(`${entry.todayHisab}`, summaryStartX + fullWidth / 2, yPos + 12, { align: 'center' });

      doc.setTextColor(0, 0, 0);

      doc.save(`${user?.companyName || 'ESCOCALC'}-entry-${entry.date}-${entry.time.replace(/[: ]/g, "-")}.pdf`);

      toast({
        title: "Exact Modal PDF Downloaded!",
        description: `PDF generated with exact modal replica layout.`,
      });
    }
  };

  // Function to capture modal and convert to PDF (when modal is open)
  const handleDownloadModalPDF = async (entry: any) => {
    try {
      // Wait a bit for modal to fully render
      await new Promise(resolve => setTimeout(resolve, 500));

      // Find the modal content element more specifically
      let modalElement = document.getElementById('modal-content-for-pdf') as HTMLElement;
      if (!modalElement) {
        // Fallback to dialog content
        modalElement = document.querySelector('[data-radix-dialog-content]') as HTMLElement;
      }
      if (!modalElement) {
        toast({
          title: "Error",
          description: "Modal content not found. Please make sure the modal is fully loaded.",
          variant: "destructive",
        });
        return;
      }

      // Ensure modal is fully visible and scrolled to top
      modalElement.scrollTop = 0;

      // Get the full height including scrollable content
      const fullHeight = modalElement.scrollHeight;
      const fullWidth = modalElement.scrollWidth;

      // Capture the modal as canvas with improved settings
      const canvas = await html2canvas(modalElement, {
        scale: 1.2, // Good balance of quality and performance
        useCORS: true,
        allowTaint: false,
        backgroundColor: '#ffffff',
        logging: false,
        imageTimeout: 20000,
        removeContainer: true,
        foreignObjectRendering: false,
        width: fullWidth,
        height: fullHeight,
        windowWidth: window.innerWidth,
        windowHeight: window.innerHeight,
        scrollX: 0,
        scrollY: 0,
        x: 0,
        y: 0,
      });

      // Create PDF with better sizing
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const margin = 5; // Smaller margin for more content
      const contentWidth = pageWidth - (2 * margin);
      const contentHeight = pageHeight - (2 * margin);

      // Calculate dimensions
      const canvasAspectRatio = canvas.height / canvas.width;
      let imgWidth = contentWidth;
      let imgHeight = imgWidth * canvasAspectRatio;

      // If image is too tall, fit to height instead
      if (imgHeight > contentHeight) {
        imgHeight = contentHeight;
        imgWidth = imgHeight / canvasAspectRatio;
      }

      // Center the image on the page
      const xOffset = margin + (contentWidth - imgWidth) / 2;
      const yOffset = margin + (contentHeight - imgHeight) / 2;

      pdf.addImage(canvas.toDataURL('image/jpeg', 0.98), 'JPEG', xOffset, yOffset, imgWidth, imgHeight);

      // Save the PDF
      pdf.save(`${user?.companyName || 'ESCOCALC'}-modal-${entry.date}-${entry.time.replace(/[: ]/g, "-")}.pdf`);

      toast({
        title: "Modal PDF Downloaded!",
        description: "Exact modal replica saved as PDF successfully.",
      });
    } catch (error) {
      console.error('Error generating modal PDF:', error);
      toast({
        title: "Error",
        description: "Failed to generate modal PDF. Please try again.",
        variant: "destructive",
      });
    }
  };


  return (
    <UserLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center gap-3 sm:gap-4">
          <img src="/logo.png" alt="Escrow Daily Hisab" className="w-10 h-10 sm:w-12 sm:h-12" />
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Financial History</h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Track your calculation history and trends
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <Card>
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center space-x-1 sm:space-x-2">
                <HistoryIcon className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground" />
                <span className="text-xs sm:text-sm font-medium">Total Entries</span>
              </div>
              <p className="text-lg sm:text-2xl font-bold mt-1 sm:mt-2">{totalEntries}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center space-x-1 sm:space-x-2">
                <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 text-profit" />
                <span className="text-xs sm:text-sm font-medium">Profitable Days</span>
              </div>
              <p className="text-lg sm:text-2xl font-bold mt-1 sm:mt-2 text-profit">
                {profitableEntries}
              </p>
              <p className="text-xs text-muted-foreground">
                {totalEntries > 0
                  ? Math.round((profitableEntries / totalEntries) * 100)
                  : 0}
                % success
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center space-x-1 sm:space-x-2">
                <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 text-profit" />
                <span className="text-xs sm:text-sm font-medium">Total Profit</span>
              </div>
              <p className="text-lg sm:text-2xl font-bold mt-1 sm:mt-2 text-profit">
                {totalProfit}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center space-x-1 sm:space-x-2">
                <TrendingDown className="w-3 h-3 sm:w-4 sm:h-4 text-loss" />
                <span className="text-xs sm:text-sm font-medium">Total Loss</span>
              </div>
              <p className="text-lg sm:text-2xl font-bold mt-1 sm:mt-2 text-loss">{totalLoss}</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Search by date or amount..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Filter by Date</label>
                <Input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                />
              </div>
            </div>

            {(searchTerm || selectedDate) && (
              <div className="flex items-center gap-2 mt-4">
                <span className="text-sm text-muted-foreground">
                  Showing {filteredEntries.length} of {entries.length} entries
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearchTerm("");
                    setSelectedDate("");
                  }}
                >
                  Clear Filters
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* History List */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Calculation History</CardTitle>
                <CardDescription>
                  All your financial calculations in chronological order
                </CardDescription>
              </div>
              <Button
                onClick={handleDownloadPDF}
                className="flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Download PDF
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {filteredEntries.length === 0 ? (
              <div className="text-center py-8">
                <HistoryIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No entries found</h3>
                <p className="text-muted-foreground">
                  {entries.length === 0
                    ? "Start making calculations to see your history here"
                    : "Try adjusting your filters to see more results"}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredEntries.map((entry, index) => (
                  <div
                    key={entry.id}
                    className="border rounded-lg p-4 hover:bg-muted/50 transition-colors animate-fade-in"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      <div className="space-y-2 flex-1">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                          <div className="flex items-center space-x-2">
                            <Calendar className="w-4 h-4 text-muted-foreground" />
                            <span className="font-medium">{entry.date}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Clock className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">
                              {entry.time}
                            </span>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">
                              Coin Report:
                            </span>
                            <div className="font-mono">{entry.sumX}</div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">
                              Fund Report:
                            </span>
                            <div className="font-mono">{entry.sumY}</div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">
                              Previous:
                            </span>
                            <div className="font-mono">
                              {entry.previousHisab || 0}
                            </div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">
                              Difference:
                            </span>
                            <div
                              className={`font-mono ${(entry.difference || 0) >= 0
                                  ? "text-profit"
                                  : "text-loss"
                                }`}
                            >
                              {(entry.difference || 0) >= 0 ? "+" : ""}
                              {entry.difference || 0}
                            </div>
                          </div>
                        </div>

                        {/* previous code  */}
                        {/* <div className="text-xs text-muted-foreground">
                          Client: {entry.A}, Upline: {entry.C} | Bank: {entry.A1}, RTGS: {entry.B1}, Expenses: {entry.C1}
                        </div> */}

                        {/* Compact summary - details available in modal */}
                        <div className="text-sm text-muted-foreground space-y-1">
                          <div>
                            Client: ₹{entry.A} | Upline: ₹{entry.C} | Bank: ₹{entry.A1} | RTGS: ₹{entry.B1} | Expenses: ₹{entry.C1}
                          </div>
                          <div className="text-xs">
                            {(entry.clients?.length || 0) + (entry.uplines?.length || 0) + (entry.banks?.length || 0) + (entry.rtgs?.length || 0) + (entry.expenses?.length || 0)} entries total • Click 👁️ for details
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-3 sm:ml-4">
                        <div className="text-center sm:text-right">
                          <div className="flex items-center justify-center sm:justify-end space-x-2">
                            <span className="text-base sm:text-lg font-bold">
                              Today's Hisab
                            </span>
                          </div>
                          <div
                            className={`text-xl sm:text-2xl font-bold ${entry.todayHisab >= 0
                                ? "text-profit"
                                : "text-loss"
                              }`}
                          >
                            {entry.todayHisab}
                          </div>
                        </div>

                        <div className="flex items-center justify-center sm:flex-col sm:space-y-2 gap-2 sm:gap-0">
                          <Badge
                            variant={
                              entry.todayHisab >= 0 ? "default" : "destructive"
                            }
                          >
                            {entry.todayHisab >= 0 ? "Profit" : "Loss"}
                          </Badge>
                          {entry.todayHisab >= 0 ? (
                            <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-profit" />
                          ) : (
                            <TrendingDown className="w-4 h-4 sm:w-5 sm:h-5 text-loss" />
                          )}
                        </div>

                        <div className="flex flex-row sm:flex-col gap-1 sm:gap-2 sm:space-y-2 justify-center sm:ml-4">
                          {/* View Details Button */}
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setViewingEntry(entry)}
                                className="px-2 py-1 h-8 text-xs sm:px-3 sm:py-2 sm:h-9 sm:text-sm w-auto"
                              >
                                <Eye className="w-3 h-3 sm:w-4 sm:h-4" />
                                <span className="ml-1 sm:ml-2 sm:hidden">View</span>
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                              <div id="modal-content-for-pdf" className="space-y-6">
                                {/* PDF Header with Logo */}
                                <div className="flex items-center justify-center gap-4 border-b pb-4 mb-6">
                                  <img src="/logo.png" alt="Logo" className="w-12 h-12" />
                                  <div className="text-center">
                                    <h1 className="text-2xl font-bold text-blue-600">ESCOCALC</h1>
                                    <p className="text-sm text-gray-600">Company: {user?.companyName || 'ESCOCALC'}</p>
                                  </div>
                                </div>

                                <DialogHeader>
                                  <div className="text-center mb-4">
                                    <DialogTitle className="text-xl">Transaction Details - {viewingEntry?.date} at {viewingEntry?.time}</DialogTitle>
                                    <div className="mt-3">
                                      <Button
                                        onClick={() => handleDownloadModalPDF(viewingEntry)}
                                        className="bg-purple-600 hover:bg-purple-700 text-white"
                                        size="sm"
                                      >
                                        <Download className="w-4 h-4 mr-2" />
                                        Download as PDF
                                      </Button>
                                    </div>
                                  </div>
                                </DialogHeader>
                                {viewingEntry && (
                                  <div className="space-y-6">
                                    {/* Income Sources */}
                                    <div>
                                      <h3 className="text-lg font-semibold text-blue-600 mb-4">Income Sources</h3>
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                                        {/* Client Balance */}
                                        <div className="space-y-2">
                                          <div className="flex items-center justify-between">
                                            <Label className="text-sm font-medium">Client Balance</Label>
                                            <div className="text-lg font-mono bg-blue-50 px-2 py-1 rounded">
                                              {viewingEntry.A}
                                            </div>
                                          </div>

                                          {/* Client entries with header row */}
                                          {(viewingEntry.clients ?? []).length > 0 && (
                                            <div className="space-y-1">
                                              {/* Header row - show labels only once */}
                                              <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground font-medium border-b pb-1">
                                                <div>Client Name</div>
                                                <div className="text-right">Amount</div>
                                              </div>
                                              {/* Data rows */}
                                              {(viewingEntry.clients ?? []).map((client, i) => (
                                                <div key={i} className="grid grid-cols-2 gap-2 py-1 px-2 bg-blue-25 rounded border text-sm">
                                                  <div className="font-mono">{client.name}</div>
                                                  <div className="font-mono text-blue-600 font-bold text-right">{client.value}</div>
                                                </div>
                                              ))}
                                            </div>
                                          )}
                                          {(viewingEntry.clients ?? []).length === 0 && (
                                            <div className="text-center py-2 text-muted-foreground text-sm">
                                              No client entries
                                            </div>
                                          )}
                                        </div>

                                        {/* Upline */}
                                        <div className="space-y-2">
                                          <div className="flex items-center justify-between">
                                            <Label className="text-sm font-medium">Upline</Label>
                                            <div className="text-lg font-mono bg-blue-50 px-2 py-1 rounded">
                                              {viewingEntry.C}
                                            </div>
                                          </div>

                                          {/* Upline entries with header row */}
                                          {(viewingEntry.uplines ?? []).length > 0 && (
                                            <div className="space-y-1">
                                              {/* Header row - show labels only once */}
                                              <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground font-medium border-b pb-1">
                                                <div>Source Name</div>
                                                <div className="text-right">Amount</div>
                                              </div>
                                              {/* Data rows */}
                                              {(viewingEntry.uplines ?? []).map((upline, i) => (
                                                <div key={i} className="grid grid-cols-2 gap-2 py-1 px-2 bg-blue-25 rounded border text-sm">
                                                  <div className="font-mono">{upline.name}</div>
                                                  <div className="font-mono text-blue-600 font-bold text-right">{upline.value}</div>
                                                </div>
                                              ))}
                                            </div>
                                          )}
                                          {(viewingEntry.uplines ?? []).length === 0 && (
                                            <div className="text-center py-2 text-muted-foreground text-sm">
                                              No upline entries
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    </div>

                                    {/* Expenses & Transfers */}
                                    <div>
                                      <h3 className="text-lg font-semibold text-green-600 mb-4">Expenses & Transfers</h3>
                                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                                        {/* Bank Balance */}
                                        <div className="space-y-2">
                                          <div className="flex items-center justify-between">
                                            <Label className="text-sm font-medium">Bank Balance</Label>
                                            <div className="text-lg font-mono bg-green-50 px-2 py-1 rounded">
                                              {viewingEntry.A1}
                                            </div>
                                          </div>

                                          {/* Bank entries with header row */}
                                          {(viewingEntry.banks ?? []).length > 0 && (
                                            <div className="space-y-1">
                                              {/* Header row - show labels only once */}
                                              <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground font-medium border-b pb-1">
                                                <div>Bank/Account</div>
                                                <div className="text-right">Amount</div>
                                              </div>
                                              {/* Data rows */}
                                              {(viewingEntry.banks ?? []).map((bank, i) => (
                                                <div key={i} className="grid grid-cols-2 gap-2 py-1 px-2 bg-green-25 rounded border text-sm">
                                                  <div className="font-mono">{bank.name}</div>
                                                  <div className="font-mono text-green-600 font-bold text-right">{bank.value}</div>
                                                </div>
                                              ))}
                                            </div>
                                          )}
                                          {(viewingEntry.banks ?? []).length === 0 && (
                                            <div className="text-center py-2 text-muted-foreground text-sm">
                                              No bank entries
                                            </div>
                                          )}
                                        </div>

                                        {/* Upar Jama / RTGS */}
                                        <div className="space-y-2">
                                          <div className="flex items-center justify-between">
                                            <Label className="text-sm font-medium">Upar Jama / RTGS</Label>
                                            <div className="text-lg font-mono bg-green-50 px-2 py-1 rounded">
                                              {viewingEntry.B1}
                                            </div>
                                          </div>

                                          {/* RTGS entries with header row */}
                                          {(viewingEntry.rtgs ?? []).length > 0 && (
                                            <div className="space-y-1">
                                              {/* Header row - show labels only once */}
                                              <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground font-medium border-b pb-1">
                                                <div>Transfer Description</div>
                                                <div className="text-right">Amount</div>
                                              </div>
                                              {/* Data rows */}
                                              {(viewingEntry.rtgs ?? []).map((rtgs, i) => (
                                                <div key={i} className="grid grid-cols-2 gap-2 py-1 px-2 bg-green-25 rounded border text-sm">
                                                  <div className="font-mono">{rtgs.desc}</div>
                                                  <div className="font-mono text-green-600 font-bold text-right">{rtgs.value}</div>
                                                </div>
                                              ))}
                                            </div>
                                          )}
                                          {(viewingEntry.rtgs ?? []).length === 0 && (
                                            <div className="text-center py-2 text-muted-foreground text-sm">
                                              No RTGS entries
                                            </div>
                                          )}
                                        </div>

                                        {/* Extra Expenses */}
                                        <div className="space-y-2">
                                          <div className="flex items-center justify-between">
                                            <Label className="text-sm font-medium">Extra Expenses</Label>
                                            <div className="text-lg font-mono bg-green-50 px-2 py-1 rounded">
                                              {viewingEntry.C1}
                                            </div>
                                          </div>

                                          {/* Expense entries with header row */}
                                          {(viewingEntry.expenses ?? []).length > 0 && (
                                            <div className="space-y-1">
                                              {/* Header row - show labels only once */}
                                              <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground font-medium border-b pb-1">
                                                <div>Expense Description</div>
                                                <div className="text-right">Amount</div>
                                              </div>
                                              {/* Data rows */}
                                              {(viewingEntry.expenses ?? []).map((expense, i) => (
                                                <div key={i} className="grid grid-cols-2 gap-2 py-1 px-2 bg-green-25 rounded border text-sm">
                                                  <div className="font-mono">{expense.desc}</div>
                                                  <div className="font-mono text-green-600 font-bold text-right">{expense.value}</div>
                                                </div>
                                              ))}
                                            </div>
                                          )}
                                          {(viewingEntry.expenses ?? []).length === 0 && (
                                            <div className="text-center py-2 text-muted-foreground text-sm">
                                              No expense entries
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    </div>

                                    {/* Calculation Summary */}
                                    <div className="border-t pt-4 space-y-6">
                                      {/* First Row: Coin and Fund Reports side by side */}
                                      <div className="grid grid-cols-2 gap-4">
                                        <div className="p-4 bg-blue-50 rounded-lg text-center">
                                          <Label className="text-sm font-medium">Coin Report (Total Income)</Label>
                                          <p className="text-2xl font-bold text-blue-600">{viewingEntry.sumX}</p>
                                        </div>
                                        <div className="p-4 bg-green-50 rounded-lg text-center">
                                          <Label className="text-sm font-medium">Fund Report (Total Expenses)</Label>
                                          <p className="text-2xl font-bold text-green-600">{viewingEntry.sumY}</p>
                                        </div>
                                      </div>

                                      {/* Difference Card - Full Width Horizontal */}
                                      <div className="w-full p-4 bg-purple-50 border border-purple-200 rounded-lg">
                                        <div className="flex items-center justify-center gap-4">
                                          <Label className="text-lg font-medium text-purple-700">Difference:</Label>
                                          <p className={`text-3xl font-bold ${(viewingEntry.difference || 0) >= 0 ? "text-purple-600" : "text-purple-800"}`}>
                                            {(viewingEntry.difference || 0) >= 0 ? "+" : ""}{viewingEntry.difference || 0}
                                          </p>
                                        </div>
                                      </div>

                                      {/* Today's Hisab Card - Full Width Horizontal */}
                                      <div className="w-full p-4 bg-muted rounded-lg">
                                        <div className="flex items-center justify-center gap-4">
                                          <Label className="text-lg font-medium">Today's Hisab:</Label>
                                          <p className={`text-3xl font-bold ${viewingEntry.todayHisab >= 0 ? "text-green-600" : "text-red-600"}`}>
                                            {viewingEntry.todayHisab >= 0 ? "+" : ""}{viewingEntry.todayHisab}
                                          </p>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </DialogContent>
                          </Dialog>



                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteEntry(entry.id)}
                            className="px-2 py-1 h-8 text-xs sm:px-3 sm:py-2 sm:h-9 sm:text-sm w-auto"
                          >
                            <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                            <span className="ml-1 sm:ml-2 sm:hidden">Delete</span>
                          </Button>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDownloadSinglePDF(entry)}
                            className="px-2 py-1 h-8 text-xs sm:px-3 sm:py-2 sm:h-9 sm:text-sm w-auto"
                          >
                            <Download className="w-3 h-3 sm:w-4 sm:h-4" />
                            <span className="ml-1 sm:ml-2 sm:hidden">PDF</span>
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </UserLayout>
  );
};
