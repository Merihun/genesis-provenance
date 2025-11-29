'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { CheckCircle2, XCircle, AlertCircle, Shield, Calendar, Tag, Home } from 'lucide-react';

interface CertificateData {
  certificate: {
    id: string;
    certificateToken: string;
    generatedAt: string;
    isActive: boolean;
  };
  item: {
    id: string;
    brand: string | null;
    model: string | null;
    year: number | null;
    referenceNumber: string | null;
    serialNumber: string | null;
    vin: string | null;
    matchingNumbers: boolean | null;
    status: string;
    category: {
      name: string;
    };
    estimatedValue: string | null;
    createdAt: string;
  };
  provenanceEventCount: number;
}

export default function VerifyCertificatePage() {
  const params = useParams();
  const token = params?.token as string;
  const [data, setData] = useState<CertificateData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCertificate = async () => {
      try {
        const response = await fetch(`/api/verify/${token}`);
        if (!response.ok) {
          throw new Error('Certificate not found or invalid');
        }
        const result = await response.json();
        setData(result);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchCertificate();
    }
  }, [token]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'flagged':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'verified':
        return <CheckCircle2 className="h-12 w-12 text-green-600" />;
      case 'pending':
        return <AlertCircle className="h-12 w-12 text-yellow-600" />;
      case 'flagged':
        return <XCircle className="h-12 w-12 text-red-600" />;
      default:
        return <Shield className="h-12 w-12 text-gray-600" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-navy-50 to-white flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl">
          <CardContent className="p-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-navy-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Verifying certificate...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-navy-50 to-white flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl">
          <CardContent className="p-12">
            <div className="text-center">
              <XCircle className="h-16 w-16 text-red-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Certificate Not Found</h2>
              <p className="text-gray-600 mb-6">
                {error || 'The certificate you are looking for does not exist or has been deactivated.'}
              </p>
              <Link href="/">
                <Button>
                  <Home className="mr-2 h-4 w-4" />
                  Go to Homepage
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { certificate, item, provenanceEventCount } = data;

  return (
    <div className="min-h-screen bg-gradient-to-br from-navy-50 to-white py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <Shield className="h-16 w-16 text-navy-600 mx-auto mb-4" />
          <h1 className="text-4xl font-bold text-navy-900 mb-2">Genesis Provenance</h1>
          <p className="text-xl text-gray-600">Certificate of Authenticity</p>
        </div>

        {/* Status Card */}
        <Card className="mb-6 border-2 border-navy-200">
          <CardContent className="p-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                {getStatusIcon(item.status)}
                <div>
                  <p className="text-sm text-gray-600 mb-1">Authentication Status</p>
                  <Badge className={getStatusColor(item.status)}>
                    {item.status.toUpperCase()}
                  </Badge>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Certificate ID</p>
                <p className="font-mono text-sm text-gray-900">{certificate.certificateToken}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Asset Information */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Tag className="mr-2 h-5 w-5" />
              Asset Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Category</p>
                <p className="font-semibold text-gray-900">{item.category.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Registered On</p>
                <p className="font-semibold text-gray-900">
                  {new Date(item.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
            </div>

            <Separator />

            <div className="grid grid-cols-2 gap-4">
              {item.brand && (
                <div>
                  <p className="text-sm text-gray-600">Brand</p>
                  <p className="font-semibold text-gray-900">{item.brand}</p>
                </div>
              )}
              {item.model && (
                <div>
                  <p className="text-sm text-gray-600">Model</p>
                  <p className="font-semibold text-gray-900">{item.model}</p>
                </div>
              )}
              {item.year && (
                <div>
                  <p className="text-sm text-gray-600">Year</p>
                  <p className="font-semibold text-gray-900">{item.year}</p>
                </div>
              )}
              {item.referenceNumber && (
                <div>
                  <p className="text-sm text-gray-600">Reference Number</p>
                  <p className="font-semibold text-gray-900">{item.referenceNumber}</p>
                </div>
              )}
              {item.serialNumber && (
                <div>
                  <p className="text-sm text-gray-600">Serial Number</p>
                  <p className="font-semibold text-gray-900">{item.serialNumber}</p>
                </div>
              )}
              {item.vin && (
                <div>
                  <p className="text-sm text-gray-600">VIN</p>
                  <p className="font-semibold text-gray-900 font-mono">{item.vin}</p>
                </div>
              )}
              {item.matchingNumbers !== null && (
                <div>
                  <p className="text-sm text-gray-600">Matching Numbers</p>
                  <p className="font-semibold text-gray-900">
                    {item.matchingNumbers ? 'Yes' : 'No'}
                  </p>
                </div>
              )}
              {item.estimatedValue && (
                <div>
                  <p className="text-sm text-gray-600">Estimated Value</p>
                  <p className="font-semibold text-gray-900">
                    ${Number(item.estimatedValue).toLocaleString()}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Provenance Summary */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="mr-2 h-5 w-5" />
              Provenance Documentation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Documented Events</p>
                <p className="text-3xl font-bold text-navy-600">{provenanceEventCount}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Certificate Generated</p>
                <p className="font-semibold text-gray-900">
                  {new Date(certificate.generatedAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-sm text-gray-600 mb-4">
            This certificate is digitally generated and cryptographically secured by Genesis Provenance.
            <br />
            For more information about our authentication process, visit our website.
          </p>
          <Link href="/">
            <Button variant="outline">
              <Home className="mr-2 h-4 w-4" />
              Visit Genesis Provenance
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
