import React, { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { axiosInstance } from '../../lib/axios'
import toast from 'react-hot-toast'

const ShareModal = ({ isOpen, onClose, itemType, itemId, itemTitle }) => {
  const queryClient = useQueryClient()
  const [sharingTo, setSharingTo] = useState(null)
  const [search, setSearch] = useState("")

  const { data: linksData, isLoading } = useQuery({
    queryKey: ['linksForShare'],
    queryFn: async () => {
      const res = await axiosInstance.get('/links')
      return res.data
    },
    enabled: isOpen,
    staleTime: 0
  })

  if (!isOpen) return null

  // Backend sometimes returns an array (res.json(user.links)) or an object { links }
  let links = []
  if (Array.isArray(linksData)) {
    links = linksData
  } else {
    links = linksData?.links || []
  }
  // Filter links by search
  const filteredLinks = links.filter(link =>
    !link.banned && (
      link.name?.toLowerCase().includes(search.toLowerCase()) ||
      link.username?.toLowerCase().includes(search.toLowerCase())
    )
  )

  const buildPath = () => {
    switch (itemType) {
      case 'post': return `/post/${itemId}`
      case 'job': return `/job/${itemId}`
      case 'discussion': return `/discussion/${itemId}`
      case 'event': return `/event/${itemId}`
      default: return '/'
    }
  }

  const handleShareTo = async (userId) => {
    setSharingTo(userId)
    try {
      const convRes = await axiosInstance.get(`/messages/conversations/${userId}`)
      const conv = convRes.data
      const path = buildPath()
      const content = `${itemTitle ? `${itemTitle} — ` : ''}${window.location.origin}${path}`
      await axiosInstance.post(`/messages/conversations/${conv._id}/messages`, { content })
      toast.success('Shared successfully')
      queryClient.invalidateQueries(['conversations'])
      queryClient.invalidateQueries(['messages', conv._id])
      onClose()
    } catch (err) {
      console.error('Share error', err)
      toast.error(err.response?.data?.message || 'Failed to share')
    } finally {
      setSharingTo(null)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow w-full max-w-md p-4">
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-semibold">Share {itemType}</h3>
          <button onClick={onClose} className="text-sm text-gray-500">Close</button>
        </div>
        <div>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search links..."
            className="w-full mb-2 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <div style={{ maxHeight: filteredLinks.length > 5 ? '16rem' : 'auto', overflowY: filteredLinks.length > 5 ? 'auto' : 'visible' }}>
            {isLoading ? (
              <div className="text-center text-sm text-gray-500">Loading links...</div>
            ) : filteredLinks.length === 0 ? (
              <div className="text-center text-sm text-gray-500">No links found to share with.</div>
            ) : (
              filteredLinks.map(link => (
                <div key={link._id} className="flex items-center justify-between py-2 border-b last:border-b-0">
                  <div className="flex items-center gap-3">
                    <img src={link.profilePicture || '/avatar.png'} alt={link.name} className="w-10 h-10 rounded-full" />
                    <div>
                      <div className="font-medium">{link.name}</div>
                      <div className="text-xs text-gray-500">@{link.username}</div>
                    </div>
                  </div>
                  <div>
                    <button
                      disabled={sharingTo === link._id}
                      onClick={() => handleShareTo(link._id)}
                      className="px-3 py-1 bg-primary text-white rounded text-sm disabled:opacity-50"
                    >
                      {sharingTo === link._id ? 'Sharing...' : 'Share'}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ShareModal
