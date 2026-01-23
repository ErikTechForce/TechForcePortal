import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { PDFDocument, rgb, StandardFonts, PDFImage } from 'pdf-lib';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import SearchableDropdown from '../components/SearchableDropdown';
import { getOrderByOrderNumber } from '../data/orders';
import { getProductsByOrderNumber } from '../data/orderProducts';
import { getClientByCompanyName } from '../data/clients';
import { employees } from '../data/tasks';
import './Page.css';
import './OrderDetail.css';
import './Orders.css';

interface ActivityLogEntry {
  id: number;
  timestamp: string;
  action: string;
  user: string;
}

interface ChatMessage {
  id: number;
  timestamp: string;
  message: string;
  user: string;
}

const OrderDetail: React.FC = () => {
  const navigate = useNavigate();
  const { orderNumber } = useParams<{ orderNumber: string }>();
  const orderData = orderNumber ? getOrderByOrderNumber(orderNumber) : null;
  const products = orderNumber ? getProductsByOrderNumber(orderNumber) : [];

  // Find client by company name
  const client = orderData ? getClientByCompanyName(orderData.companyName) : null;

  const [stage, setStage] = useState<'Contract' | 'Delivery' | 'Installation'>(
    orderData?.category === 'Contract' ? 'Contract' : 
    orderData?.category === 'Inventory' ? 'Delivery' : 
    'Installation'
  );
  const [status, setStatus] = useState(orderData?.status || 'Pending');
  const [employee, setEmployee] = useState(orderData?.employee || '');
  const [lastContactDate, setLastContactDate] = useState(orderData?.lastContactDate || '');
  const [trackingNumber, setTrackingNumber] = useState(orderData?.trackingNumber || '');
  const [estimatedDeliveryDate, setEstimatedDeliveryDate] = useState(orderData?.estimatedDeliveryDate || '');
  const [shippingAddress, setShippingAddress] = useState(orderData?.shippingAddress || '');
  const [deliverTo, setDeliverTo] = useState(orderData?.deliverTo || '');
  const [streetAddress, setStreetAddress] = useState('');
  const [aptNumber, setAptNumber] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [country, setCountry] = useState('United States');
  const [installationAppointmentTime, setInstallationAppointmentTime] = useState(orderData?.installationAppointmentTime || '');
  const [installationEmployee, setInstallationEmployee] = useState(orderData?.installationEmployee || '');
  const [siteLocation, setSiteLocation] = useState(orderData?.siteLocation || '');
  const [installationDate, setInstallationDate] = useState('');
  const [installationTime, setInstallationTime] = useState('');
  const [siteStreetAddress, setSiteStreetAddress] = useState('');
  const [siteAptNumber, setSiteAptNumber] = useState('');
  const [siteCity, setSiteCity] = useState('');
  const [siteState, setSiteState] = useState('');
  const [siteZipCode, setSiteZipCode] = useState('');
  const [siteCountry, setSiteCountry] = useState('United States');
  const [isShippingModalOpen, setIsShippingModalOpen] = useState(false);
  const [isInstallationModalOpen, setIsInstallationModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isContractModalOpen, setIsContractModalOpen] = useState(false);
  const [contractLink, setContractLink] = useState('');
  const [signature, setSignature] = useState<string | null>(null);
  const signatureCanvasRef = React.useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [filledPdfUrl, setFilledPdfUrl] = useState<string | null>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [editStage, setEditStage] = useState<'Contract' | 'Delivery' | 'Installation'>(
    orderData?.category === 'Contract' ? 'Contract' : 
    orderData?.category === 'Inventory' ? 'Delivery' : 
    'Installation'
  );
  const [editStatus, setEditStatus] = useState(orderData?.status || 'Pending');
  const [editEmployee, setEditEmployee] = useState(orderData?.employee || '');
  const [editLastContactDate, setEditLastContactDate] = useState(orderData?.lastContactDate || '');
  const [editTrackingNumber, setEditTrackingNumber] = useState(orderData?.trackingNumber || '');
  const [editEstimatedDeliveryDate, setEditEstimatedDeliveryDate] = useState(orderData?.estimatedDeliveryDate || '');
  const [editShippingAddress, setEditShippingAddress] = useState(orderData?.shippingAddress || '');
  const [editDeliverTo, setEditDeliverTo] = useState(orderData?.deliverTo || '');
  const [editStreetAddress, setEditStreetAddress] = useState('');
  const [editAptNumber, setEditAptNumber] = useState('');
  const [editCity, setEditCity] = useState('');
  const [editState, setEditState] = useState('');
  const [editZipCode, setEditZipCode] = useState('');
  const [editCountry, setEditCountry] = useState('United States');
  const [editInstallationAppointmentTime, setEditInstallationAppointmentTime] = useState(orderData?.installationAppointmentTime || '');
  const [editInstallationEmployee, setEditInstallationEmployee] = useState(orderData?.installationEmployee || '');
  const [editSiteLocation, setEditSiteLocation] = useState(orderData?.siteLocation || '');
  const [editInstallationDate, setEditInstallationDate] = useState('');
  const [editInstallationTime, setEditInstallationTime] = useState('');
  const [editSiteStreetAddress, setEditSiteStreetAddress] = useState('');
  const [editSiteAptNumber, setEditSiteAptNumber] = useState('');
  const [editSiteCity, setEditSiteCity] = useState('');
  const [editSiteState, setEditSiteState] = useState('');
  const [editSiteZipCode, setEditSiteZipCode] = useState('');
  const [editSiteCountry, setEditSiteCountry] = useState('United States');
  const [activityLog, setActivityLog] = useState<ActivityLogEntry[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTemplatedModalOpen, setIsTemplatedModalOpen] = useState(false);
  const [isChatLogModalOpen, setIsChatLogModalOpen] = useState(false);
  const chatEndRef = React.useRef<HTMLDivElement>(null);

  // Templated messages
  const templatedMessages = [
    {
      id: 1,
      title: 'Initial Contact',
      message: `Dear ${orderData?.companyName || 'Client'},

Thank you for your order. Someone from the Techforce Team will contact you shortly to discuss the details and next steps.

If you have any questions in the meantime, please do not hesitate to reach out.

Best regards,
Techforce Team`
    },
    {
      id: 2,
      title: 'Order Confirmation',
      message: `Dear ${orderData?.companyName || 'Client'},

We have received your order ${orderData?.orderNumber || ''} and are currently processing it. We will keep you updated on the status as we move forward.

Thank you for choosing Techforce.

Best regards,
Techforce Team`
    },
    {
      id: 3,
      title: 'Status Update',
      message: `Dear ${orderData?.companyName || 'Client'},

This is an update regarding your order ${orderData?.orderNumber || ''}. 

[Please provide specific status update here]

Please feel free to reach out if you have any questions or concerns.

Best regards,
Techforce Team`
    },
    {
      id: 4,
      title: 'Follow Up',
      message: `Dear ${orderData?.companyName || 'Client'},

We wanted to follow up on your order ${orderData?.orderNumber || ''} to ensure everything is proceeding smoothly.

Is there anything we can assist you with at this time?

Best regards,
Techforce Team`
    }
  ];

  // Helper function to format timestamp
  const getCurrentTimestamp = React.useCallback((): string => {
    const now = new Date();
    const date = now.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
    const time = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    return `${date} ${time}`;
  }, []);

  // Helper function to add activity log entry
  const addActivityLog = React.useCallback((action: string, user: string = 'System') => {
    const newEntry: ActivityLogEntry = {
      id: Date.now(),
      timestamp: getCurrentTimestamp(),
      action,
      user
    };
    setActivityLog(prev => [newEntry, ...prev]);
  }, [getCurrentTimestamp]);

  // Scroll chat to bottom when new messages are added
  React.useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Handle sending a chat message
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim()) {
      const timestamp = getCurrentTimestamp();
      const messageText = newMessage.trim();
      const messageUser = employee || 'System';
      
      const message: ChatMessage = {
        id: Date.now(),
        timestamp: timestamp,
        message: messageText,
        user: messageUser
      };
      setChatMessages(prev => [...prev, message]);
      setNewMessage('');
      
      // Add activity log entry for sent message
      const messagePreview = messageText.length > 50 ? messageText.substring(0, 50) + '...' : messageText;
      addActivityLog(`Sent chat message: "${messagePreview}"`, messageUser);
      
      // Update last contact date when a message is sent
      if (stage === 'Contract') {
        setLastContactDate(timestamp);
        setEditLastContactDate(timestamp);
      }
    }
  };

  // Handle opening templated messages modal
  const handleOpenTemplatedMessages = () => {
    setIsTemplatedModalOpen(true);
  };

  // Handle selecting a templated message
  const handleSelectTemplatedMessage = (message: string) => {
    setNewMessage(message);
    setIsTemplatedModalOpen(false);
  };

  // Helper function to convert 12-hour time to 24-hour format
  const convertTo24Hour = (time12h: string): string => {
    const [time, modifier] = time12h.split(/\s*(AM|PM)/i);
    if (!time) return '';
    let [hours, minutes] = time.split(':');
    if (hours === '12') {
      hours = modifier?.toUpperCase() === 'AM' ? '00' : '12';
    } else if (modifier?.toUpperCase() === 'PM') {
      hours = String(parseInt(hours, 10) + 12).padStart(2, '0');
    } else {
      hours = hours.padStart(2, '0');
    }
    return `${hours}:${minutes || '00'}`;
  };

  // Helper function to convert 24-hour time to 12-hour format
  const convertTo12Hour = (time24h: string): string => {
    if (!time24h) return '';
    const [hours, minutes] = time24h.split(':');
    const hour24 = parseInt(hours, 10);
    const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;
    const ampm = hour24 >= 12 ? 'PM' : 'AM';
    return `${hour12}:${minutes || '00'} ${ampm}`;
  };

  // Get status options based on stage
  const getStatusOptions = (currentStage: 'Contract' | 'Delivery' | 'Installation'): string[] => {
    switch (currentStage) {
      case 'Contract':
        return ['Pending', 'In Progress', 'Approved'];
      case 'Delivery':
        return ['Pending', 'In Shipment', 'Delivered'];
      case 'Installation':
        return ['Pending', 'Scheduled', 'In Progress', 'Completed'];
      default:
        return ['Pending'];
    }
  };

  useEffect(() => {
    if (orderData) {
      const initialStage = orderData.category === 'Contract' ? 'Contract' : 
                          orderData.category === 'Inventory' ? 'Delivery' : 
                          'Installation';
      setStage(initialStage);
      setStatus(orderData.status);
      setEmployee(orderData.employee || '');
      setLastContactDate(orderData.lastContactDate || '');
      setTrackingNumber(orderData.trackingNumber || '');
      setEstimatedDeliveryDate(orderData.estimatedDeliveryDate || '');
      setShippingAddress(orderData.shippingAddress || '');
      setDeliverTo(orderData.deliverTo || '');
      setInstallationAppointmentTime(orderData.installationAppointmentTime || '');
      setInstallationEmployee(orderData.installationEmployee || '');
      setSiteLocation(orderData.siteLocation || '');
      // Parse installation date and time
      if (orderData.installationAppointmentTime) {
        const dateTimeMatch = orderData.installationAppointmentTime.match(/(\d{4}-\d{2}-\d{2})\s+(\d{1,2}:\d{2}\s+(?:AM|PM))/i);
        if (dateTimeMatch) {
          setInstallationDate(dateTimeMatch[1]);
          // Convert 12-hour format to 24-hour format for time input
          const time12Hour = dateTimeMatch[2];
          const time24Hour = convertTo24Hour(time12Hour);
          setInstallationTime(time24Hour);
        } else {
          // Try to parse as date and time separately
          const parts = orderData.installationAppointmentTime.split(' ');
          if (parts.length >= 2) {
            setInstallationDate(parts[0]);
            const timePart = parts.slice(1).join(' ');
            // Check if it's already in 24-hour format
            if (timePart.match(/^\d{2}:\d{2}$/)) {
              setInstallationTime(timePart);
            } else {
              // Convert 12-hour format to 24-hour format
              setInstallationTime(convertTo24Hour(timePart));
            }
          }
        }
      }
      // Parse site location if it exists
      if (orderData.siteLocation) {
        const addressLines = orderData.siteLocation.split('\n');
        if (addressLines.length > 0) {
          const firstLine = addressLines[0];
          const aptMatch = firstLine.match(/(.*?)(?:Apt|Unit|#|Suite)\s*([A-Z0-9-]+)/i);
          if (aptMatch) {
            setSiteStreetAddress(aptMatch[1].trim());
            setSiteAptNumber(aptMatch[2].trim());
          } else {
            setSiteStreetAddress(firstLine);
            setSiteAptNumber('');
          }
          if (addressLines.length > 1) {
            const cityStateZip = addressLines[1];
            const match = cityStateZip.match(/(.+?),\s*([A-Z]{2})\s+(\d{5}(?:-\d{4})?)/);
            if (match) {
              setSiteCity(match[1].trim());
              setSiteState(match[2].trim());
              setSiteZipCode(match[3].trim());
            }
          }
          if (addressLines.length > 2) {
            setSiteCountry(addressLines[2].trim());
          }
        }
      }
      setEditStage(initialStage);
      setEditStatus(orderData.status);
      setEditEmployee(orderData.employee || '');
      setEditLastContactDate(orderData.lastContactDate || '');
      setEditTrackingNumber(orderData.trackingNumber || '');
      setEditEstimatedDeliveryDate(orderData.estimatedDeliveryDate || '');
      setEditShippingAddress(orderData.shippingAddress || '');
      setEditDeliverTo(orderData.deliverTo || '');
      setEditInstallationAppointmentTime(orderData.installationAppointmentTime || '');
      setEditInstallationEmployee(orderData.installationEmployee || '');
      setEditSiteLocation(orderData.siteLocation || '');
      
      // Initialize activity log with order creation entry
      const now = new Date();
      const date = now.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
      const time = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
      const timestamp = `${date} ${time}`;
      
      const initialLog: ActivityLogEntry[] = [
        {
          id: Date.now() - 1000,
          timestamp: timestamp,
          action: `Order ${orderData.orderNumber} created`,
          user: orderData.employee || 'System'
        }
      ];
      setActivityLog(initialLog);
    }
  }, [orderData]);

  // When stage changes, validate and update status if needed
  useEffect(() => {
    const validStatuses = getStatusOptions(stage);
    if (!validStatuses.includes(status)) {
      setStatus(validStatuses[0]); // Reset to first option if current status is not valid for new stage
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage]);

  // When edit stage changes, validate and update edit status if needed
  useEffect(() => {
    const validStatuses = getStatusOptions(editStage);
    if (!validStatuses.includes(editStatus)) {
      setEditStatus(validStatuses[0]); // Reset to first option if current status is not valid for new stage
    }
    // Note: We don't clear stage-specific fields when stage changes in edit mode
    // This allows users to see and edit the fields for the current stage
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editStage]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle save logic here
    console.log('Order updated:', { orderNumber, stage, status, employee });
    // Navigate back to orders
    navigate('/orders');
  };

  const handleEditSave = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Track changes and add to activity log
    const changes: string[] = [];
    
    if (stage !== editStage) {
      changes.push(`Stage changed from ${stage} to ${editStage}`);
    }
    if (status !== editStatus) {
      changes.push(`Status changed from ${status} to ${editStatus}`);
    }
    if (employee !== editEmployee) {
      const oldEmployee = employee || 'unassigned';
      const newEmployee = editEmployee || 'unassigned';
      changes.push(`Employee changed from ${oldEmployee} to ${newEmployee}`);
    }
    if (lastContactDate !== editLastContactDate) {
      if (editLastContactDate) {
        changes.push(`Last contact date ${lastContactDate ? `changed to ${editLastContactDate}` : `set to ${editLastContactDate}`}`);
      }
    }
    if (trackingNumber !== editTrackingNumber) {
      if (editTrackingNumber) {
        changes.push(`Tracking number ${trackingNumber ? `changed to ${editTrackingNumber}` : `set to ${editTrackingNumber}`}`);
      }
    }
    if (estimatedDeliveryDate !== editEstimatedDeliveryDate) {
      if (editEstimatedDeliveryDate) {
        changes.push(`Estimated delivery date ${estimatedDeliveryDate ? `changed to ${editEstimatedDeliveryDate}` : `set to ${editEstimatedDeliveryDate}`}`);
      }
    }
    if (installationAppointmentTime !== editInstallationAppointmentTime) {
      if (editInstallationAppointmentTime) {
        changes.push(`Installation appointment ${installationAppointmentTime ? `changed to ${editInstallationAppointmentTime}` : `set to ${editInstallationAppointmentTime}`}`);
      }
    }

    // Add activity log entries for each change
    changes.forEach(change => {
      addActivityLog(change, editEmployee || 'System');
    });

    // If no specific changes, log a general update
    if (changes.length === 0) {
      addActivityLog('Order information updated', editEmployee || 'System');
    }

    // Update the state with edited values
    setStage(editStage);
    setStatus(editStatus);
    setEmployee(editEmployee);
    setLastContactDate(editLastContactDate);
    setTrackingNumber(editTrackingNumber);
    setEstimatedDeliveryDate(editEstimatedDeliveryDate);
    setInstallationAppointmentTime(editInstallationAppointmentTime);
    
    // Handle save logic here
    console.log('Order updated:', { 
      orderNumber, 
      stage: editStage, 
      status: editStatus, 
      employee: editEmployee,
      lastContactDate: editLastContactDate,
      trackingNumber: editTrackingNumber,
      installationAppointmentTime: editInstallationAppointmentTime
    });
    setIsEditModalOpen(false);
  };

  const handleEditCancel = () => {
    // Reset edit values to current values
    setEditStage(stage);
    setEditStatus(status);
    setEditEmployee(employee);
    setEditLastContactDate(lastContactDate);
    setEditTrackingNumber(trackingNumber);
    setEditEstimatedDeliveryDate(estimatedDeliveryDate);
    setEditShippingAddress(shippingAddress);
    setEditDeliverTo(deliverTo);
    setEditInstallationAppointmentTime(installationAppointmentTime);
    setIsEditModalOpen(false);
  };

  // Fallback random ID generator if crypto.randomUUID() is not available
  const generateRandomId = useCallback(() => {
    // Generate a 32-character random hex string
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }, []);

  // Contract generation handlers
  const generateContractLink = useCallback(() => {
    if (!orderData) return '';
    // Generate a random, secure contract ID to avoid unwanted access
    // Using crypto.randomUUID() for a cryptographically secure random identifier
    const randomId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : generateRandomId();
    const contractId = randomId.replace(/-/g, ''); // Remove hyphens for cleaner URL
    // In a real app, this would be a backend-generated URL and stored securely
    const baseUrl = window.location.origin;
    return `${baseUrl}/contract/${contractId}`;
  }, [orderData, generateRandomId]);

  // PDF Form Field Mapping Configuration
  // Update these field names to match your PDF form field names
  // To find the actual field names, use the inspectPdfFields function below
  const PDF_FIELD_MAPPING: Record<string, string> = {
    // Map our data fields to PDF form field names
    businessName: 'Business Name / Location',
    serviceAddress: 'Service Address',
    cityStateZip: 'City, State, Zip',
    locationContactNamePhone: 'Location Contact Name & Phone',
    locationContactEmail: 'Location Contact Email',
    authorizedPersonName: 'Authorized Person Name',
    authorizedPersonTitle: 'Authorized Person Title',
    authorizedPersonEmail: 'Authorized Person Email',
    authorizedPersonPhone: 'Authorized Person Phone',
    effectiveDate: 'Effective Date',
    // Add more mappings as needed
  };

  // Utility function to inspect PDF form fields (for debugging)
  const inspectPdfFields = async () => {
    try {
      const pdfUrl = '/trialAgreementLocation.pdf';
      const existingPdfBytes = await fetch(pdfUrl).then(res => res.arrayBuffer());
      const pdfDoc = await PDFDocument.load(existingPdfBytes);
      const form = pdfDoc.getForm();
      
      const fields: string[] = [];
      form.getFields().forEach((field) => {
        const fieldName = field.getName();
        fields.push(fieldName);
      });
      
      console.log('=== PDF Form Fields ===');
      console.log('Available form fields:', fields);
      console.log('Field count:', fields.length);
      fields.forEach((field, index) => {
        console.log(`${index + 1}. "${field}"`);
      });
      console.log('======================');
      
      // Also show in an alert for easy copying
      alert(`Found ${fields.length} form fields:\n\n${fields.join('\n')}\n\nCheck console for details.`);
      
      return fields;
    } catch (error) {
      console.error('Error inspecting PDF fields:', error);
      return [];
    }
  };

  // Text and Image Placement Coordinates Configuration
  // Update these X, Y coordinates to match where text/images should be placed on your PDF
  // Coordinates are in points (72 points = 1 inch), measured from bottom-left corner
  // You'll need to measure your PDF to find the exact positions
  const TEXT_PLACEMENTS: Record<string, { x: number; y: number; fontSize?: number; width?: number; height?: number }> = {
    // Page 1 coordinates (adjust these based on your PDF layout)
    effectiveDate: { x: 400, y: 750, fontSize: 10 }, // Example: Effective Date position
    businessName: { x: 100, y: 700, fontSize: 10 }, // Business Name / Location
    serviceAddress: { x: 100, y: 680, fontSize: 10 }, // Service Address
    cityStateZip: { x: 100, y: 660, fontSize: 10 }, // City, State, Zip
    locationContactNamePhone: { x: 100, y: 640, fontSize: 10 }, // Location Contact Name & Phone
    locationContactEmail: { x: 100, y: 620, fontSize: 10 }, // Location Contact Email
    authorizedPersonName: { x: 100, y: 600, fontSize: 10 }, // Authorized Person Name
    authorizedPersonTitle: { x: 300, y: 600, fontSize: 10 }, // Authorized Person Title
    authorizedPersonEmail: { x: 100, y: 580, fontSize: 10 }, // Authorized Person Email
    authorizedPersonPhone: { x: 100, y: 560, fontSize: 10 }, // Authorized Person Phone
    // Signature placement - next to "Signature:" in right column under "Business Name 'Client'"
    // Based on typical PDF layout: right column signature area
    // Adjust these if needed - x should be to the right (around 300-400 for right column)
    // y should be in the lower-middle area where signature section is (around 200-300)
    clientSignature: { x: 330, y: 590, width: 180, height: 54 }, // Client signature position (10% smaller)
    // Add more placements as needed
  };

  const fillPdfWithData = async (signatureImage?: string | null) => {
    if (!orderData || !client) return null;

    try {
      setIsGeneratingPdf(true);
      
      // Fetch the PDF template
      const pdfUrl = '/trialAgreementLocation.pdf';
      const existingPdfBytes = await fetch(pdfUrl).then(res => res.arrayBuffer());
      
      // Load the PDF
      const pdfDoc = await PDFDocument.load(existingPdfBytes);
      
      // Get current date for effective date
      const today = new Date();
      const formattedDate = `${String(today.getMonth() + 1).padStart(2, '0')}/${String(today.getDate()).padStart(2, '0')}/${today.getFullYear()}`;
      
      // Count products (robots, bins, bases)
      const robotCount = products.filter(p => p.productName.includes('Robot')).length;
      const binCount = products.filter(p => p.productName.includes('Bin')).length;
      const baseCount = products.filter(p => p.productName.includes('Base')).length;
      
      // Parse addresses
      const parseAddress = (address: string) => {
        if (!address) return { street: '', city: '', state: '', zip: '' };
        const lines = address.split('\n');
        const street = lines[0] || '';
        const cityStateZip = lines[1] || '';
        const match = cityStateZip.match(/(.+?),\s*([A-Z]{2})\s+(\d{5}(?:-\d{4})?)/);
        if (match) {
          return {
            street,
            city: match[1].trim(),
            state: match[2].trim(),
            zip: match[3].trim()
          };
        }
        return { street, city: '', state: '', zip: '' };
      };
      
      // Use placeholder addresses or parse from available data
      const serviceAddress = parseAddress(siteLocation || shippingAddress || '');
      const billingAddr = parseAddress(shippingAddress || '');
      
      // Get pages (signature is typically on the last page)
      const pages = pdfDoc.getPages();
      const firstPage = pages[0];
      const lastPage = pages[pages.length - 1]; // Use last page for signature
      
      // Load a font
      const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const helveticaBoldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      
      // Helper function to place text on PDF
      const placeText = (key: string, text: string, page = firstPage) => {
        const placement = TEXT_PLACEMENTS[key];
        if (!placement) {
          console.warn(`No placement coordinates found for: ${key}`);
          return false;
        }
        
        try {
          page.drawText(text, {
            x: placement.x,
            y: placement.y,
            size: placement.fontSize || 10,
            font: helveticaFont,
            color: rgb(0, 0, 0),
          });
          console.log(`✓ Placed "${key}" at (${placement.x}, ${placement.y}): ${text}`);
          return true;
        } catch (e) {
          console.error(`Error placing text for "${key}":`, e);
          return false;
        }
      };
      
      // Try to fill form fields first (if any exist)
      try {
        const form = pdfDoc.getForm();
        const fields = form.getFields();
        console.log(`Found ${fields.length} form fields, attempting to fill...`);
        
        // Try filling the ENVELOPEID field if it exists (though it's not useful)
        // This is just to show the form field approach still works
      } catch (e) {
        console.log('No form fields found or form not accessible, using text placement only');
      }
      
      // Place text on the PDF using coordinates
      console.log('=== Placing Text on PDF ===');
      placeText('effectiveDate', formattedDate);
      placeText('businessName', orderData.companyName);
      placeText('serviceAddress', serviceAddress.street);
      placeText('cityStateZip', `${serviceAddress.city}, ${serviceAddress.state} ${serviceAddress.zip}`);
      placeText('locationContactNamePhone', `${client.pointOfContact} ${client.contactPhone || ''}`);
      placeText('locationContactEmail', client.contactEmail || '');
      placeText('authorizedPersonName', client.pointOfContact);
      placeText('authorizedPersonEmail', client.contactEmail || '');
      placeText('authorizedPersonPhone', client.contactPhone || '');
      console.log('=== Finished Placing Text ===');
      
      // Place signature image if provided
      if (signatureImage) {
        try {
          console.log('=== Placing Signature on PDF ===');
          const signaturePlacement = TEXT_PLACEMENTS.clientSignature;
          
          // Get page dimensions for reference
          const pageSize = lastPage.getSize();
          console.log(`Page dimensions: ${pageSize.width} × ${pageSize.height} points`);
          
          // Convert data URL to image bytes
          const imageBytes = await fetch(signatureImage).then(res => res.arrayBuffer());
          const signaturePdfImage = await pdfDoc.embedPng(imageBytes);
          
          // Get signature dimensions
          const sigWidth = signaturePlacement.width || 200;
          const sigHeight = signaturePlacement.height || 60;
          
          // Place signature on the last page (where signature section typically is)
          // Using exact coordinates from TEXT_PLACEMENTS (no offset)
          lastPage.drawImage(signaturePdfImage, {
            x: signaturePlacement.x,
            y: signaturePlacement.y,
            width: sigWidth,
            height: sigHeight,
          });
          
          console.log(`✓ Placed signature at (${signaturePlacement.x}, ${signaturePlacement.y})`);
          console.log(`  Signature size: ${sigWidth} × ${sigHeight} points`);
          console.log('=== Finished Placing Signature ===');
        } catch (error) {
          console.error('Error placing signature on PDF:', error);
        }
      }
      
      // Generate PDF bytes
      const pdfBytes = await pdfDoc.save();
      
      // Create blob URL
      const blob = new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      
      setIsGeneratingPdf(false);
      return url;
    } catch (error) {
      console.error('Error filling PDF:', error);
      setIsGeneratingPdf(false);
      return null;
    }
  };

  const handleGenerateContract = () => {
    const link = generateContractLink();
    setContractLink(link);
    setIsContractModalOpen(true);
    // Clear signature canvas if it exists
    if (signatureCanvasRef.current) {
      const ctx = signatureCanvasRef.current.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, signatureCanvasRef.current.width, signatureCanvasRef.current.height);
      }
    }
  };

  // Cleanup blob URL on unmount or modal close
  useEffect(() => {
    return () => {
      if (filledPdfUrl && filledPdfUrl.startsWith('blob:')) {
        URL.revokeObjectURL(filledPdfUrl);
      }
    };
  }, [filledPdfUrl]);

  const handleCopyLink = () => {
    if (contractLink) {
      navigator.clipboard.writeText(contractLink).then(() => {
        alert('Contract link copied to clipboard!');
      }).catch(() => {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = contractLink;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        alert('Contract link copied to clipboard!');
      });
    }
  };

  // Signature pad handlers
  const startDrawing = useCallback((e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
  }, []);

  const draw = useCallback((e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  }, [isDrawing]);

  const stopDrawing = useCallback(() => {
    setIsDrawing(false);
  }, []);

  const clearSignature = () => {
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setSignature(null);
  };

  const saveSignature = () => {
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;

    const dataURL = canvas.toDataURL('image/png');
    setSignature(dataURL);
    alert('Signature saved! The contract can now be finalized.');
  };

  useEffect(() => {
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, []);

  const handleEditClick = () => {
    // Set edit values to current values
    setEditStage(stage);
    setEditStatus(status);
    setEditEmployee(employee);
    setEditLastContactDate(lastContactDate);
    setEditTrackingNumber(trackingNumber);
    setEditEstimatedDeliveryDate(estimatedDeliveryDate);
    setEditShippingAddress(shippingAddress);
    setEditDeliverTo(deliverTo);
    setEditInstallationAppointmentTime(installationAppointmentTime);
    setIsEditModalOpen(true);
  };

  const handleCompanyClick = () => {
    if (client) {
      navigate(`/client/${client.id}`);
    }
  };

  if (!orderData) {
    return (
      <div className="page-container">
        <Header />
        <div className="page-layout">
          <Sidebar />
          <main className="page-main">
            <div className="page-content">
              <h2 className="page-title">Order Not Found</h2>
              <button onClick={() => navigate('/orders')}>Back to Orders</button>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <Header />
      <div className="page-layout">
        <Sidebar />
        <main className="page-main">
          <div className="page-content">
            <div className="order-detail-header">
              <h2 className="page-title">Order Details</h2>
              <button 
                className="back-button" 
                onClick={() => navigate('/orders')}
              >
                ← Back to Orders
              </button>
            </div>
            <p className="page-subtitle">View and update order information</p>
            
            {/* Order Information Card */}
            <div className={`order-info-card stage-${stage.toLowerCase()}`}>
              <div className="order-info-header">
                <h3 className="section-title">Order Information</h3>
                <button 
                  type="button" 
                  className="edit-order-button"
                  onClick={handleEditClick}
                >
                  Edit
                </button>
              </div>
              
              <div className="order-info-grid">
                <div className="order-info-item">
                  <label className="order-info-label">Order Number</label>
                  <div className="order-info-value">{orderData.orderNumber}</div>
                </div>

                <div className="order-info-item">
                  <label className="order-info-label">Company Name</label>
                  <div 
                    className="order-info-value clickable-company"
                    onClick={handleCompanyClick}
                    style={{ cursor: 'pointer' }}
                  >
                    {orderData.companyName}
                  </div>
                </div>

                <div className="order-info-item">
                  <label className="order-info-label">Stage</label>
                  <div className="order-info-value">
                    <span className={`stage-badge stage-${stage.toLowerCase()}`}>
                      {stage}
                    </span>
                  </div>
                </div>

                <div className="order-info-item">
                  <label className="order-info-label">Status</label>
                  <div className="order-info-value">
                    <span className={`status-badge status-${status.toLowerCase().replace(' ', '-')}`}>
                      {status}
                    </span>
                  </div>
                </div>

                <div className="order-info-item">
                  <label className="order-info-label">Employee</label>
                  <div className="order-info-value">{employee || 'unassigned'}</div>
                </div>

                {stage === 'Contract' && (
                  <div className="order-info-item">
                    <label className="order-info-label">Last Contact Date</label>
                    <div className="order-info-value">
                      {chatMessages.length === 0 ? 'Not contacted' : (lastContactDate || 'Not set')}
                    </div>
                  </div>
                )}

                {stage === 'Delivery' && (
                  <>
                    <div className="order-info-item">
                      <label className="order-info-label">Tracking Number</label>
                      <div className="order-info-value">{trackingNumber || 'Not set'}</div>
                    </div>
                    <div className="order-info-item">
                      <label className="order-info-label">Estimated Delivery Date</label>
                      <div className="order-info-value">{estimatedDeliveryDate || 'Not set'}</div>
                    </div>
                    <div className="order-info-item">
                      <label className="order-info-label">Shipping Address</label>
                      <div className="order-info-value">{shippingAddress || 'Not set'}</div>
                    </div>
                  </>
                )}

                {stage === 'Installation' && (
                  <>
                    <div className="order-info-item">
                      <label className="order-info-label">Installation Appointment</label>
                      <div className="order-info-value">{installationAppointmentTime || 'Not set'}</div>
                    </div>
                    {installationEmployee && (
                      <div className="order-info-item">
                        <label className="order-info-label">Installation Employee</label>
                        <div className="order-info-value">{installationEmployee}</div>
                      </div>
                    )}
                    {siteLocation && (
                      <div className="order-info-item">
                        <label className="order-info-label">Site Location</label>
                        <div className="order-info-value">{siteLocation}</div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Generate Contract Button - Only for Contract stage */}
            {stage === 'Contract' && (
              <div style={{ marginTop: '1rem', marginBottom: '1rem', display: 'flex', justifyContent: 'flex-start', paddingLeft: '1rem' }}>
                <button 
                  type="button"
                  className="generate-contract-button"
                  onClick={handleGenerateContract}
                >
                  Generate Contract
                </button>
              </div>
            )}

            {/* Shipping Information Button - Only for Delivery stage */}
            {stage === 'Delivery' && (
              <div style={{ marginTop: '1rem', marginBottom: '1rem', display: 'flex', justifyContent: 'flex-start', paddingLeft: '1rem' }}>
                <button 
                  type="button"
                  className="shipping-info-button"
                  onClick={() => {
                    setEditTrackingNumber(trackingNumber);
                    setEditDeliverTo(deliverTo);
                    // Parse existing shipping address if it exists
                    if (shippingAddress) {
                      // Try to parse the address (simple parsing - can be improved)
                      const addressLines = shippingAddress.split('\n');
                      if (addressLines.length > 0) {
                        const firstLine = addressLines[0];
                        const aptMatch = firstLine.match(/(.*?)(?:Apt|Unit|#|Suite)\s*([A-Z0-9-]+)/i);
                        if (aptMatch) {
                          setEditStreetAddress(aptMatch[1].trim());
                          setEditAptNumber(aptMatch[2].trim());
                        } else {
                          setEditStreetAddress(firstLine);
                          setEditAptNumber('');
                        }
                        if (addressLines.length > 1) {
                          const cityStateZip = addressLines[1];
                          const match = cityStateZip.match(/(.+?),\s*([A-Z]{2})\s+(\d{5}(?:-\d{4})?)/);
                          if (match) {
                            setEditCity(match[1].trim());
                            setEditState(match[2].trim());
                            setEditZipCode(match[3].trim());
                          }
                        }
                        if (addressLines.length > 2) {
                          setEditCountry(addressLines[2].trim());
                        }
                      }
                    } else {
                      // Reset fields if no address exists
                      setEditStreetAddress('');
                      setEditAptNumber('');
                      setEditCity('');
                      setEditState('');
                      setEditZipCode('');
                      setEditCountry('United States');
                    }
                    setIsShippingModalOpen(true);
                  }}
                >
                  Enter Shipping Information
                </button>
              </div>
            )}

            {/* Installation Appointment Button - Only for Installation stage */}
            {stage === 'Installation' && (
              <div style={{ marginTop: '1rem', marginBottom: '1rem', display: 'flex', justifyContent: 'flex-start', paddingLeft: '1rem' }}>
                <button 
                  type="button"
                  className="installation-appointment-button"
                  onClick={() => {
                    setEditInstallationAppointmentTime(installationAppointmentTime);
                    setEditInstallationDate(installationDate);
                    setEditInstallationTime(installationTime);
                    setEditInstallationEmployee(installationEmployee);
                    setEditSiteLocation(siteLocation);
                    // Parse existing site location if it exists
                    if (siteLocation) {
                      const addressLines = siteLocation.split('\n');
                      if (addressLines.length > 0) {
                        const firstLine = addressLines[0];
                        const aptMatch = firstLine.match(/(.*?)(?:Apt|Unit|#|Suite)\s*([A-Z0-9-]+)/i);
                        if (aptMatch) {
                          setEditSiteStreetAddress(aptMatch[1].trim());
                          setEditSiteAptNumber(aptMatch[2].trim());
                        } else {
                          setEditSiteStreetAddress(firstLine);
                          setEditSiteAptNumber('');
                        }
                        if (addressLines.length > 1) {
                          const cityStateZip = addressLines[1];
                          const match = cityStateZip.match(/(.+?),\s*([A-Z]{2})\s+(\d{5}(?:-\d{4})?)/);
                          if (match) {
                            setEditSiteCity(match[1].trim());
                            setEditSiteState(match[2].trim());
                            setEditSiteZipCode(match[3].trim());
                          }
                        }
                        if (addressLines.length > 2) {
                          setEditSiteCountry(addressLines[2].trim());
                        }
                      }
                    } else {
                      // Reset fields if no address exists
                      setEditSiteStreetAddress('');
                      setEditSiteAptNumber('');
                      setEditSiteCity('');
                      setEditSiteState('');
                      setEditSiteZipCode('');
                      setEditSiteCountry('United States');
                    }
                    setIsInstallationModalOpen(true);
                  }}
                >
                  Setting Installation Appointment
                </button>
              </div>
            )}

            {/* Edit Modal */}
            {isEditModalOpen && (
              <div className="modal-overlay" onClick={handleEditCancel}>
                <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                  <div className="modal-header">
                    <h3 className="modal-title">Edit Order Information</h3>
                    <button 
                      className="modal-close-button"
                      onClick={handleEditCancel}
                      aria-label="Close"
                    >
                      ×
                    </button>
                  </div>
                  
                  <form className="modal-form" onSubmit={handleEditSave}>
                <div className="form-group">
                      <label htmlFor="editOrderNumber" className="form-label">Order Number</label>
                  <input
                    type="text"
                        id="editOrderNumber"
                    className="form-input"
                    value={orderData.orderNumber}
                    disabled
                    readOnly
                  />
                </div>

                <div className="form-group">
                      <label htmlFor="editCompanyName" className="form-label">Company Name</label>
                  <input
                    type="text"
                        id="editCompanyName"
                        className="form-input"
                    value={orderData.companyName}
                        disabled
                    readOnly
                  />
                </div>

                <div className="form-group">
                      <label htmlFor="editStage" className="form-label">Stage</label>
                  <select
                        id="editStage"
                    className="form-select"
                        value={editStage}
                        onChange={(e) => setEditStage(e.target.value as 'Contract' | 'Delivery' | 'Installation')}
                  >
                    <option value="Contract">Contract</option>
                    <option value="Delivery">Delivery</option>
                    <option value="Installation">Installation</option>
                  </select>
                </div>

                <div className="form-group">
                      <label htmlFor="editStatus" className="form-label">Status</label>
                  <select
                        id="editStatus"
                    className="form-select"
                        value={editStatus}
                        onChange={(e) => setEditStatus(e.target.value)}
                  >
                        {getStatusOptions(editStage).map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                      <label htmlFor="editEmployee" className="form-label">Employee</label>
                      <SearchableDropdown
                        options={employees}
                        value={editEmployee}
                        onChange={setEditEmployee}
                        placeholder="Select or type employee name..."
                        required={false}
                      />
                    </div>

                    {editStage === 'Contract' && (
                      <div className="form-group">
                        <label htmlFor="editLastContactDate" className="form-label">Last Contact Date</label>
                        <input
                          type="text"
                          id="editLastContactDate"
                          className="form-input"
                          value={editLastContactDate}
                          onChange={(e) => setEditLastContactDate(e.target.value)}
                          placeholder="e.g., 2024-01-15 10:30 AM"
                        />
                      </div>
                    )}

                    {editStage === 'Delivery' && (
                      <>
                        <div className="form-group">
                          <label htmlFor="editTrackingNumber" className="form-label">Tracking Number</label>
                          <input
                            type="text"
                            id="editTrackingNumber"
                            className="form-input"
                            value={editTrackingNumber}
                            onChange={(e) => setEditTrackingNumber(e.target.value)}
                            placeholder="e.g., TRK-123456789"
                          />
                        </div>
                        <div className="form-group">
                          <label htmlFor="editEstimatedDeliveryDate" className="form-label">Estimated Delivery Date</label>
                          <input
                            type="date"
                            id="editEstimatedDeliveryDate"
                            className="form-input"
                            value={editEstimatedDeliveryDate}
                            onChange={(e) => setEditEstimatedDeliveryDate(e.target.value)}
                          />
                        </div>
                      </>
                    )}

                    {editStage === 'Installation' && (
                      <div className="form-group">
                        <label htmlFor="editInstallationAppointmentTime" className="form-label">Installation Appointment Time</label>
                        <input
                          type="text"
                          id="editInstallationAppointmentTime"
                          className="form-input"
                          value={editInstallationAppointmentTime}
                          onChange={(e) => setEditInstallationAppointmentTime(e.target.value)}
                          placeholder="e.g., 2024-01-20 09:00 AM"
                        />
                      </div>
                    )}

                    <div className="modal-actions">
                      <button type="button" className="cancel-button" onClick={handleEditCancel}>
                        Cancel
                      </button>
                      <button type="submit" className="save-button">
                        Save
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Shipping Information Modal */}
            {isShippingModalOpen && (
              <div className="modal-overlay" onClick={() => setIsShippingModalOpen(false)}>
                <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                  <div className="modal-header">
                    <h3 className="modal-title">Enter Shipping Information</h3>
                    <button 
                      className="modal-close-button"
                      onClick={() => setIsShippingModalOpen(false)}
                      aria-label="Close"
                    >
                      ×
                    </button>
                  </div>
                  
                  <form className="modal-form" onSubmit={(e) => {
                    e.preventDefault();
                    setTrackingNumber(editTrackingNumber);
                    setDeliverTo(editDeliverTo);
                    
                    // Build full address string from components
                    const addressParts = [];
                    if (editStreetAddress) addressParts.push(editStreetAddress);
                    if (editAptNumber) addressParts.push(`Apt ${editAptNumber}`);
                    const addressLine1 = addressParts.join(', ');
                    
                    const addressLine2 = [];
                    if (editCity) addressLine2.push(editCity);
                    if (editState) addressLine2.push(editState);
                    if (editZipCode) addressLine2.push(editZipCode);
                    const cityStateZip = addressLine2.join(', ');
                    
                    const fullAddress = [addressLine1, cityStateZip, editCountry].filter(Boolean).join('\n');
                    setShippingAddress(fullAddress);
                    setEditShippingAddress(fullAddress);
                    
                    // Add activity log entries
                    if (trackingNumber !== editTrackingNumber && editTrackingNumber) {
                      addActivityLog(`Tracking number ${trackingNumber ? `changed to ${editTrackingNumber}` : `set to ${editTrackingNumber}`}`, employee || 'System');
                    }
                    if (shippingAddress !== fullAddress && fullAddress) {
                      addActivityLog(`Shipping address ${shippingAddress ? 'updated' : 'set'}`, employee || 'System');
                    }
                    if (deliverTo !== editDeliverTo && editDeliverTo) {
                      addActivityLog(`Deliver to ${deliverTo ? `changed to ${editDeliverTo}` : `set to ${editDeliverTo}`}`, employee || 'System');
                    }
                    setIsShippingModalOpen(false);
                  }}>
                    <div className="form-group">
                      <label htmlFor="deliverTo" className="form-label">Deliver To</label>
                      <input
                        type="text"
                        id="deliverTo"
                        className="form-input"
                        value={editDeliverTo}
                        onChange={(e) => setEditDeliverTo(e.target.value)}
                        placeholder="Enter recipient name..."
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="shippingTrackingNumber" className="form-label">Tracking Number</label>
                      <input
                        type="text"
                        id="shippingTrackingNumber"
                        className="form-input"
                        value={editTrackingNumber}
                        onChange={(e) => setEditTrackingNumber(e.target.value)}
                        placeholder="e.g., TRK-123456789"
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="streetAddress" className="form-label">Street Address</label>
                      <input
                        type="text"
                        id="streetAddress"
                        className="form-input"
                        value={editStreetAddress}
                        onChange={(e) => setEditStreetAddress(e.target.value)}
                        placeholder="Enter street address..."
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="aptNumber" className="form-label">Apartment, Suite, Unit, etc. (Optional)</label>
                      <input
                        type="text"
                        id="aptNumber"
                        className="form-input"
                        value={editAptNumber}
                        onChange={(e) => setEditAptNumber(e.target.value)}
                        placeholder="Apt, Unit, Suite, etc."
                      />
                    </div>

                    <div className="form-row">
                      <div className="form-group" style={{ flex: 2 }}>
                        <label htmlFor="city" className="form-label">City</label>
                        <input
                          type="text"
                          id="city"
                          className="form-input"
                          value={editCity}
                          onChange={(e) => setEditCity(e.target.value)}
                          placeholder="City"
                        />
                      </div>

                      <div className="form-group" style={{ flex: 1 }}>
                        <label htmlFor="state" className="form-label">State</label>
                        <input
                          type="text"
                          id="state"
                          className="form-input"
                          value={editState}
                          onChange={(e) => setEditState(e.target.value.toUpperCase())}
                          placeholder="State"
                          maxLength={2}
                          style={{ textTransform: 'uppercase' }}
                        />
                      </div>

                      <div className="form-group" style={{ flex: 1 }}>
                        <label htmlFor="zipCode" className="form-label">Zip Code</label>
                        <input
                          type="text"
                          id="zipCode"
                          className="form-input"
                          value={editZipCode}
                          onChange={(e) => setEditZipCode(e.target.value.replace(/\D/g, '').slice(0, 10))}
                          placeholder="Zip Code"
                          maxLength={10}
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label htmlFor="country" className="form-label">Country</label>
                      <input
                        type="text"
                        id="country"
                        className="form-input"
                        value={editCountry}
                        onChange={(e) => setEditCountry(e.target.value)}
                        placeholder="Country"
                      />
                    </div>

                    <div className="modal-actions">
                      <button type="button" className="cancel-button" onClick={() => setIsShippingModalOpen(false)}>
                        Cancel
                      </button>
                      <button type="submit" className="save-button">
                        Save
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Chat Log */}
            <div className="chat-log-section">
              <div className="chat-log-header">
                <h3 className="section-title">Chat Log</h3>
                {chatMessages.length > 0 && (
                  <button 
                    type="button"
                    className="chat-view-modal-button"
                    onClick={() => setIsChatLogModalOpen(true)}
                  >
                    View Full Log
                  </button>
                )}
              </div>
              <div className="chat-messages-container">
                {chatMessages.length > 0 ? (
                  <div className="chat-messages-list">
                    {chatMessages.map((msg) => (
                      <div key={msg.id} className="chat-message">
                        <div className="chat-message-header">
                          <span className="chat-message-user">{msg.user}</span>
                          <span className="chat-message-timestamp">{msg.timestamp}</span>
                        </div>
                        <div className="chat-message-content" style={{ whiteSpace: 'pre-wrap' }}>{msg.message}</div>
                      </div>
                    ))}
                    <div ref={chatEndRef} />
                  </div>
                ) : (
                  <p className="chat-empty">No messages yet. Start a conversation about this order.</p>
                )}
              </div>
              <form className="chat-input-form" onSubmit={handleSendMessage}>
                <textarea
                  className="chat-input"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  rows={4}
                />
                <div className="chat-buttons-row">
                  <button 
                    type="button" 
                    className="chat-templated-button"
                    onClick={handleOpenTemplatedMessages}
                  >
                    Templated Messages
                  </button>
                  <button type="submit" className="chat-send-button" disabled={!newMessage.trim()}>
                    Send
                  </button>
                </div>
              </form>
            </div>

            {/* Chat Log Modal */}
            {isChatLogModalOpen && (
              <div className="modal-overlay" onClick={() => setIsChatLogModalOpen(false)}>
                <div className="modal-content chat-log-modal-content" onClick={(e) => e.stopPropagation()}>
                  <div className="modal-header">
                    <h3 className="modal-title">Chat Log</h3>
                    <button 
                      className="modal-close-button"
                      onClick={() => setIsChatLogModalOpen(false)}
                      aria-label="Close"
                    >
                      ×
                    </button>
                  </div>
                  
                  <div className="chat-log-modal-container">
                    {chatMessages.length > 0 ? (
                      <div className="chat-messages-list">
                        {chatMessages.map((msg) => (
                          <div key={msg.id} className="chat-message">
                            <div className="chat-message-header">
                              <span className="chat-message-user">{msg.user}</span>
                              <span className="chat-message-timestamp">{msg.timestamp}</span>
                            </div>
                            <div className="chat-message-content" style={{ whiteSpace: 'pre-wrap' }}>{msg.message}</div>
                          </div>
                        ))}
                        <div ref={chatEndRef} />
                      </div>
                    ) : (
                      <p className="chat-empty">No messages yet. Start a conversation about this order.</p>
                    )}
                  </div>
                  
                  <form className="chat-input-form modal-chat-form" onSubmit={handleSendMessage}>
                    <textarea
                      className="chat-input"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type a message..."
                      rows={5}
                    />
                    <div className="chat-buttons-row">
                      <button 
                        type="button" 
                        className="chat-templated-button"
                        onClick={handleOpenTemplatedMessages}
                      >
                        Templated Messages
                      </button>
                      <button type="submit" className="chat-send-button" disabled={!newMessage.trim()}>
                        Send
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Installation Appointment Modal */}
            {isInstallationModalOpen && (
              <div className="modal-overlay" onClick={() => setIsInstallationModalOpen(false)}>
                <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                  <div className="modal-header">
                    <h3 className="modal-title">Setting Installation Appointment</h3>
                    <button 
                      className="modal-close-button"
                      onClick={() => setIsInstallationModalOpen(false)}
                      aria-label="Close"
                    >
                      ×
                    </button>
                  </div>
                  
                  <form className="modal-form" onSubmit={(e) => {
                    e.preventDefault();
                    // Build date and time string (convert 24-hour to 12-hour format for display)
                    const time12Hour = editInstallationTime ? convertTo12Hour(editInstallationTime) : '';
                    const dateTimeString = editInstallationDate && editInstallationTime 
                      ? `${editInstallationDate} ${time12Hour}`
                      : '';
                    setInstallationAppointmentTime(dateTimeString);
                    setEditInstallationAppointmentTime(dateTimeString);
                    setInstallationDate(editInstallationDate);
                    setInstallationTime(editInstallationTime);
                    setInstallationEmployee(editInstallationEmployee);
                    
                    // Build full site location address string from components
                    const addressParts = [];
                    if (editSiteStreetAddress) addressParts.push(editSiteStreetAddress);
                    if (editSiteAptNumber) addressParts.push(`Apt ${editSiteAptNumber}`);
                    const addressLine1 = addressParts.join(', ');
                    
                    const addressLine2 = [];
                    if (editSiteCity) addressLine2.push(editSiteCity);
                    if (editSiteState) addressLine2.push(editSiteState);
                    if (editSiteZipCode) addressLine2.push(editSiteZipCode);
                    const cityStateZip = addressLine2.join(', ');
                    
                    const fullSiteLocation = [addressLine1, cityStateZip, editSiteCountry].filter(Boolean).join('\n');
                    setSiteLocation(fullSiteLocation);
                    setEditSiteLocation(fullSiteLocation);
                    setSiteStreetAddress(editSiteStreetAddress);
                    setSiteAptNumber(editSiteAptNumber);
                    setSiteCity(editSiteCity);
                    setSiteState(editSiteState);
                    setSiteZipCode(editSiteZipCode);
                    setSiteCountry(editSiteCountry);
                    
                    // Add activity log entries
                    if (installationAppointmentTime !== dateTimeString && dateTimeString) {
                      addActivityLog(`Installation appointment ${installationAppointmentTime ? `changed to ${dateTimeString}` : `set to ${dateTimeString}`}`, employee || 'System');
                    }
                    if (installationEmployee !== editInstallationEmployee && editInstallationEmployee) {
                      addActivityLog(`Installation employee ${installationEmployee ? `changed to ${editInstallationEmployee}` : `assigned to ${editInstallationEmployee}`}`, employee || 'System');
                    }
                    if (siteLocation !== fullSiteLocation && fullSiteLocation) {
                      addActivityLog(`Site location ${siteLocation ? 'updated' : 'set'}`, employee || 'System');
                    }
                    setIsInstallationModalOpen(false);
                  }}>
                    <div className="form-group">
                      <label htmlFor="installationEmployee" className="form-label">Assign Employee</label>
                  <SearchableDropdown
                    options={employees}
                        value={editInstallationEmployee}
                        onChange={setEditInstallationEmployee}
                    placeholder="Select or type employee name..."
                    required={false}
                  />
                    </div>

                    <div className="form-row">
                      <div className="form-group" style={{ flex: 1 }}>
                        <label htmlFor="installationDate" className="form-label">Installation Date</label>
                        <input
                          type="date"
                          id="installationDate"
                          className="form-input"
                          value={editInstallationDate}
                          onChange={(e) => setEditInstallationDate(e.target.value)}
                        />
                      </div>

                      <div className="form-group" style={{ flex: 1 }}>
                        <label htmlFor="installationTime" className="form-label">Installation Time</label>
                        <input
                          type="time"
                          id="installationTime"
                          className="form-input"
                          value={editInstallationTime}
                          onChange={(e) => setEditInstallationTime(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label htmlFor="siteStreetAddress" className="form-label">Street Address</label>
                      <input
                        type="text"
                        id="siteStreetAddress"
                        className="form-input"
                        value={editSiteStreetAddress}
                        onChange={(e) => setEditSiteStreetAddress(e.target.value)}
                        placeholder="Enter street address..."
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="siteAptNumber" className="form-label">Apartment, Suite, Unit, etc. (Optional)</label>
                      <input
                        type="text"
                        id="siteAptNumber"
                        className="form-input"
                        value={editSiteAptNumber}
                        onChange={(e) => setEditSiteAptNumber(e.target.value)}
                        placeholder="Apt, Unit, Suite, etc."
                      />
                    </div>

                    <div className="form-row">
                      <div className="form-group" style={{ flex: 2 }}>
                        <label htmlFor="siteCity" className="form-label">City</label>
                        <input
                          type="text"
                          id="siteCity"
                          className="form-input"
                          value={editSiteCity}
                          onChange={(e) => setEditSiteCity(e.target.value)}
                          placeholder="City"
                        />
                      </div>

                      <div className="form-group" style={{ flex: 1 }}>
                        <label htmlFor="siteState" className="form-label">State</label>
                        <input
                          type="text"
                          id="siteState"
                          className="form-input"
                          value={editSiteState}
                          onChange={(e) => setEditSiteState(e.target.value.toUpperCase())}
                          placeholder="State"
                          maxLength={2}
                          style={{ textTransform: 'uppercase' }}
                        />
                      </div>

                      <div className="form-group" style={{ flex: 1 }}>
                        <label htmlFor="siteZipCode" className="form-label">Zip Code</label>
                        <input
                          type="text"
                          id="siteZipCode"
                          className="form-input"
                          value={editSiteZipCode}
                          onChange={(e) => setEditSiteZipCode(e.target.value.replace(/\D/g, '').slice(0, 10))}
                          placeholder="Zip Code"
                          maxLength={10}
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label htmlFor="siteCountry" className="form-label">Country</label>
                      <input
                        type="text"
                        id="siteCountry"
                        className="form-input"
                        value={editSiteCountry}
                        onChange={(e) => setEditSiteCountry(e.target.value)}
                        placeholder="Country"
                      />
                    </div>

                    <div className="modal-actions">
                      <button type="button" className="cancel-button" onClick={() => setIsInstallationModalOpen(false)}>
                        Cancel
                      </button>
                      <button type="submit" className="save-button">
                        Save
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Templated Messages Modal */}
            {isTemplatedModalOpen && (
              <div className="modal-overlay" onClick={() => setIsTemplatedModalOpen(false)}>
                <div className="modal-content templated-modal-content" onClick={(e) => e.stopPropagation()}>
                  <div className="modal-header">
                    <h3 className="modal-title">Select Templated Message</h3>
                    <button 
                      className="modal-close-button"
                      onClick={() => setIsTemplatedModalOpen(false)}
                      aria-label="Close"
                    >
                      ×
                    </button>
                  </div>
                  
                  <div className="templated-messages-list">
                    {templatedMessages.map((template) => (
                      <div 
                        key={template.id}
                        className="templated-message-item"
                        onClick={() => handleSelectTemplatedMessage(template.message)}
                      >
                        <div className="templated-message-title">{template.title}</div>
                        <div className="templated-message-preview">{template.message}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Contract Generation Modal */}
            {isContractModalOpen && (
              <div className="modal-overlay" onClick={() => setIsContractModalOpen(false)}>
                <div className="modal-content contract-modal-content" onClick={(e) => e.stopPropagation()}>
                  <div className="modal-header">
                    <h3 className="modal-title">Generate Contract</h3>
                    <button 
                      className="modal-close-button"
                      onClick={() => setIsContractModalOpen(false)}
                      aria-label="Close"
                    >
                      ×
                    </button>
                  </div>
                  
                  <div className="contract-modal-body">
                    {/* Contract Link Section */}
                    <div className="contract-link-section">
                      <label className="form-label">Shareable Contract Link</label>
                      <div className="contract-link-container">
                        <input
                          type="text"
                          className="contract-link-input"
                          value={contractLink}
                          readOnly
                        />
                        <button
                          type="button"
                          className="copy-link-button"
                          onClick={handleCopyLink}
                        >
                          Copy Link
                        </button>
                      </div>
                      <p className="contract-link-help">
                        Share this link with the client to view and sign the contract.
                      </p>
                    </div>
                  </div>

                  <div className="modal-actions">
                    <button
                      type="button"
                      className="cancel-button"
                      onClick={() => setIsContractModalOpen(false)}
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Activity Log */}
            <div className="activity-log-section">
              <h3 className="section-title">Activity Log</h3>
              {activityLog.length > 0 ? (
                <div className="activity-log-container">
                  <table className="activity-log-table">
                    <thead>
                      <tr>
                        <th>Timestamp</th>
                        <th>Action</th>
                        <th>User</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activityLog.map((entry) => (
                        <tr key={entry.id}>
                          <td>{entry.timestamp}</td>
                          <td>{entry.action}</td>
                          <td>{entry.user}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="activity-log-empty">No activity recorded yet.</p>
              )}
              </div>

              <div className="form-section">
                <h3 className="section-title">Products</h3>
                {products.length > 0 ? (
                  <div className="products-table-wrapper">
                    <table className="products-table">
                      <thead>
                        <tr>
                          <th>Product Name</th>
                          <th>Serial Number</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {products.map((product) => (
                          <tr key={product.id}>
                            <td>{product.productName}</td>
                            <td>{product.serialNumber || 'N/A'}</td>
                            <td>
                              <span className={`status-badge status-${(product.status || 'pending').toLowerCase().replace(' ', '-')}`}>
                                {product.status || 'Pending'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="no-products">No products found for this order.</p>
                )}
              </div>

          </div>
        </main>
      </div>
    </div>
  );
};

export default OrderDetail;

