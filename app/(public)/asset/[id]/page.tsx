'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { CheckCircle, AlertTriangle, Clock, Shield, Calendar, Tag, Loader2, ExternalLink, QrCode } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { formatDistanceToNow } from 'date-fns';

interface PublicAsset {
  id: string;
  brand?: string;
  model?: string;
  year?: number;
  category: {
    name: string;
    slug: string;
  };
  status: string;
  vin?: string;
  serialNumber?: string;
  estimatedValue?: number;
  createdAt: string;
  organization: {
    name: string;
    type: string;
  };
  provenanceEventCount: number;
  mediaAssets: Array<{
    id: string;
    url: string;
    mediaType: string;
  }>;
  aiAnalysis?: {
    status: string;
    confidenceScore?: number;
    fraudRiskLevel?: string;
  };
}

export default function PublicAssetPage() {
  const params = useParams();
  const [asset, setAsset] = useState<PublicAsset | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showQR, setShowQR] = useState(false);

  useEffect(() => {
    const fetchAsset = async () => {
      try {
        const response = await fetch(`/api/public/asset/${params.id}`);
        if (!response.ok) {
          throw new Error('Asset not found or not public');
        }
        const data = await response.json();
        setAsset(data.asset);
      } catch (err: any) {
        setError(err.message || 'Failed to load asset');
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchAsset();
    }
  }, [params.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin text-gold mx-auto" />
          <p className="text-gray-400">Loading asset information...</p>
        </div>
      </div>
    );
  }

  if (error || !asset) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-8 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Asset Not Found</h1>
          <p className="text-gray-600">
            {error || 'This asset may not exist or is not publicly accessible.'}
          </p>
          <Link href="/">
            <Button className="w-full">Go to Homepage</Button>
          </Link>
        </Card>
      </div>
    );
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'verified':
        return <CheckCircle className="w-5 h-5" />;
      case 'pending':
        return <Clock className="w-5 h-5" />;
      case 'flagged':
        return <AlertTriangle className="w-5 h-5" />;
      default:
        return <Shield className="w-5 h-5" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'flagged':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${asset.brand || ''} ${asset.model || 'Asset'} - Genesis Provenance`,
          text: `View this verified ${asset.category.name} on Genesis Provenance`,
          url: shareUrl,
        });
      } catch (err) {
        console.log('Share cancelled');
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Header */}
      <header className="bg-navy/50 backdrop-blur border-b border-gold/10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-xl font-bold text-gold">
              Genesis Provenance
            </Link>
            <Badge className="bg-gold/10 text-gold border-gold/20">
              <Shield className="w-3 h-3 mr-1" />
              Public Verification
            </Badge>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Main Asset Card */}
        <Card className="overflow-hidden">
          {/* Image Gallery */}
          {asset.mediaAssets.length > 0 && (
            <div className="relative aspect-video bg-gray-100">
              <Image
                src={asset.mediaAssets[0].url}
                alt={`${asset.brand || ''} ${asset.model || 'Asset'}`}
                fill
                className="object-cover"
                priority
              />
            </div>
          )}

          <div className="p-6 space-y-6">
            {/* Title & Status */}
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                    {asset.brand && asset.model
                      ? `${asset.brand} ${asset.model}`
                      : asset.category.name}
                  </h1>
                  {asset.year && (
                    <p className="text-lg text-gray-600 mt-1">
                      {asset.year}
                    </p>
                  )}
                </div>
                <Badge
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold border ${getStatusColor(
                    asset.status
                  )}`}
                >
                  {getStatusIcon(asset.status)}
                  {asset.status.charAt(0).toUpperCase() + asset.status.slice(1)}
                </Badge>
              </div>

              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Tag className="w-4 h-4" />
                <span>{asset.category.name}</span>
                <span>•</span>
                <span>Verified by {asset.organization.name}</span>
              </div>
            </div>

            <Separator />

            {/* Asset Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {asset.serialNumber && (
                <div>
                  <p className="text-sm text-gray-600">Serial Number</p>
                  <p className="font-mono text-sm font-medium text-gray-900">
                    {asset.serialNumber}
                  </p>
                </div>
              )}
              {asset.vin && (
                <div>
                  <p className="text-sm text-gray-600">VIN</p>
                  <p className="font-mono text-sm font-medium text-gray-900">
                    {asset.vin}
                  </p>
                </div>
              )}
              {asset.estimatedValue && (
                <div>
                  <p className="text-sm text-gray-600">Estimated Value</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {formatCurrency(asset.estimatedValue)}
                  </p>
                </div>
              )}
              <div>
                <p className="text-sm text-gray-600">Registered</p>
                <p className="text-sm font-medium text-gray-900">
                  {formatDistanceToNow(new Date(asset.createdAt), { addSuffix: true })}
                </p>
              </div>
            </div>

            {/* AI Authentication */}
            {asset.aiAnalysis && asset.aiAnalysis.status === 'completed' && (
              <>
                <Separator />
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-blue-600" />
                    <h3 className="font-semibold text-gray-900">AI Authentication</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Confidence Score</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {asset.aiAnalysis.confidenceScore}%
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Risk Level</p>
                      <Badge
                        className={`text-sm ${
                          asset.aiAnalysis.fraudRiskLevel === 'low'
                            ? 'bg-green-100 text-green-800'
                            : asset.aiAnalysis.fraudRiskLevel === 'medium'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {asset.aiAnalysis.fraudRiskLevel?.toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Provenance */}
            <Separator />
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-gray-600" />
                <h3 className="font-semibold text-gray-900">Provenance Documentation</h3>
              </div>
              <p className="text-sm text-gray-600">
                This asset has <span className="font-semibold text-gray-900">{asset.provenanceEventCount}</span> documented
                provenance {asset.provenanceEventCount === 1 ? 'event' : 'events'} in its history.
              </p>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              {typeof window !== 'undefined' && 'share' in navigator && (
                <Button onClick={handleShare} variant="outline" className="flex-1">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Share
                </Button>
              )}
              <Button
                onClick={() => setShowQR(!showQR)}
                variant="outline"
                className="flex-1"
              >
                <QrCode className="w-4 h-4 mr-2" />
                {showQR ? 'Hide' : 'Show'} QR Code
              </Button>
              <Link href="/" className="flex-1">
                <Button className="w-full bg-gradient-to-r from-navy to-navy/90 text-gold">
                  Get Started Free
                </Button>
              </Link>
            </div>

            {/* QR Code */}
            {showQR && (
              <div className="border-t pt-6 text-center">
                <p className="text-sm text-gray-600 mb-4">
                  Scan this QR code to view this asset on any device
                </p>
                <div className="inline-block p-4 bg-white border-2 border-gray-200 rounded-lg">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
                      shareUrl
                    )}`}
                    alt="QR Code"
                    className="w-48 h-48"
                  />
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Trust Badge */}
        <Card className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">
                Verified by Genesis Provenance
              </h3>
              <p className="text-sm text-gray-700">
                This asset has been authenticated and its provenance documented using AI-powered verification
                and blockchain-ready digital certificates. The information displayed on this page is publicly
                verifiable and maintained by {asset.organization.name}.
              </p>
            </div>
          </div>
        </Card>

        {/* Footer CTA */}
        <div className="text-center py-8">
          <p className="text-gray-400 mb-4">
            Want to protect your luxury assets with AI-powered authentication?
          </p>
          <Link href="/">
            <Button size="lg" className="bg-gradient-to-r from-navy to-navy/90 text-gold">
              Start Free Trial
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
