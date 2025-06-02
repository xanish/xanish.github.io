+++
title = "Understanding Bloom Filters: A Simple Guide"
description = "Discover Bloom Filters: The surprisingly simple, memory-efficient way to speed up checks in large datasets. Learn how they work, manage false positives, and see a Go example."
date = 2025-01-01T19:27:17+05:30
draft = false
tags = [
    "Bloom Filter",
    "Go",
    "Hashing",
    "Performance",
]
categories = [
    "Backend Development",
    "Data Structures",
    "System Design",
]
[params]
math = true
+++

When dealing with large databases, verifying whether an item belongs to a collection can be a slow and tedious process. Common data structures like hash tables, trees, and arrays can be slow or memory-intensive, especially when you’re dealing with millions or billions of elements. This is where a Bloom Filter can help. It offers a significantly more memory-efficient approach and can be faster, particularly when its use prevents more costly operations like disk I/O. However, this comes with some interesting caveats.

In this post, we will learn what Bloom Filters are, how they work, and how we can optimize them for our use. We will also see an improved implementation of the same in Go!

## What is a bloom filter?

A Bloom Filter is a probabilistic data structure used to check if an element is **possibly** in a set or **definitely not** in a set. It is extremely efficient in terms of speed and, most notably, memory usage. But the catch is that sometimes it can produce **false positives**.

**False positives** occur when the filter incorrectly indicates an element is in the set when it actually isn't. However, if the filter says an element is **not** present, you can be 100% sure it's not there (no false negatives).

## Where are Bloom Filters used?

Some real-world examples of using Bloom Filters include:

- **Databases (e.g., Cassandra, LevelDB, RocksDB):** To reduce disk lookups for non-existent rows or keys. A false positive might result in an unnecessary disk read (a small cost), but a "definitely not" saves that read entirely.
- **Web Crawlers (e.g., Google BigTable uses them):** To avoid re-crawling pages that have already been visited. A false positive means a page might be skipped occasionally, which is often an acceptable trade-off for massive efficiency gains.
- **Content Recommendation Systems:** To filter out articles or products a user has already seen. A false positive might mean a user doesn't get shown one item they haven't seen, usually not critical.
- **Intrusion Detection Systems:** To store suspicious IPs and flag or control access. A false positive might flag a safe IP, requiring a secondary check, which is better than missing a threat.
- **Email Spam Filters:** To identify known spam signatures or senders. A false positive could incorrectly flag a legitimate email, so the FP rate needs to be very low and often combined with other checks.
- **Blockchains (e.g., Bitcoin, Ethereum):** To quickly check if a transaction or log has likely been processed or if an address is part of a large set, without querying the entire chain.

## How Do Bloom Filters Work?

Simply put, they work by hashing elements with different hash functions and then marking specific bits corresponding to those hashes in a bit array. Let’s look at it step by step:

1. **Create a Bit Array**: Start with an array of `m` bits, all set to 0. This is typically implemented using a byte array for memory efficiency.
2. **Hash the Input**: When an element is added, it is hashed `k` times using different hash functions (or techniques that simulate different hash functions). Each function produces an index in the bit array.
3. **Set the Bits**: For each of the `k` hash results (indices), set the corresponding bit in the array to 1.
4. **Check Membership**: To check if an element is in the set, hash it again using the same `k` functions. If **all** the corresponding bits at these `k` indices are 1, the element **might** be in the set (it could be a false positive). If **any** bit is 0, the element is **definitely not** in the set.

There are a few things to keep in mind. First, the **hash functions** don’t need to be cryptographically secure. They just need to be fast, distribute values uniformly across the bit array, and be independent of each other. Common choices include MurmurHash, FNV, or xxHash.

The main concern, as mentioned, is the possibility of **false positives**. As you add more elements to a Bloom Filter, more bits in the array get set to 1, and the chance of a false positive increases. This is the fundamental trade-off for its efficiency and space-saving benefits.

Additionally, **standard Bloom Filters do not support deletions**. Removing an item by flipping its bits from 1 to 0 is problematic because those bits might also be part of the representation for other items in the filter. Doing so could introduce false negatives, which Bloom filters are designed to avoid. (Variants like Counting Bloom Filters can support deletion at the cost of more memory).

## Bloom Filters vs. Hash Tables (for Membership)

To better understand where Bloom Filters shine, here's a quick comparison with Hash Tables when used purely for membership testing:

| Feature          | Bloom Filter                                                                             | Hash Table (for membership)                      |
| ---------------- | ---------------------------------------------------------------------------------------- | ------------------------------------------------ |
| Memory Usage     | Very Low (e.g., 1-2 bytes/item for 1% FP rate)                                           | Moderate to High (stores actual keys + overhead) |
| Speed (Add)      | O(k) - k hash computations                                                               | O(1) average, O(N) worst                         |
| Speed (Check)    | O(k) - k hash computations                                                               | O(1) average, O(N) worst                         |
| False Positives  | Yes (probability is tunable)                                                             | No                                               |
| False Negatives  | No                                                                                       | No                                               |
| Deletion         | No (standard), Yes (variants like Counting BF)                                           | Yes                                              |
| Store Elements   | No (only their "fingerprint" in the bit array)                                           | Yes (stores actual elements/keys)                |
| Primary Use Case | Fast, memory-efficient probabilistic membership test, especially to avoid costly checks. | Exact membership testing, key-value storage.     |

## Not A One Size Fits All: Tuning Your Bloom Filter

The effectiveness of a Bloom Filter depends critically on its configuration. You need to fine-tune the following parameters for your specific use case:

- The **size of the bit array** (m).
- The **number of hash functions** (k).

#### Calculating the Optimal Size of the Bit Array (m)

The **optimal size** of the bit array is calculated with the formula:
$$ m = \frac{-n \cdot \ln(p)}{(\ln(2))^2} $$
Where:

- `n` is the **number of elements** you plan to add to the filter.
- `p` is the **acceptable false positive rate** (e.g., 0.01 for 1%).

This formula tells you how large the bit array needs to be to maintain the desired false positive rate `p` given `n` elements. A larger `m` means more bits, reducing the chance of collisions and thus lowering the false positive rate, but at the cost of more memory.

#### Calculating the Optimal Number of Hash Functions (k)

Once you know `m`, you can calculate the **optimal number of hash functions** (`k`):
$$ k = \frac{m}{n} \cdot \ln(2) $$
Where:

- `m` is the size of the bit array.
- `n` is the number of elements.

This formula helps choose `k` to minimize the false positive rate. Too few hash functions (`k` is small) won't distribute the "fingerprints" well enough. Too many (`k` is large) will cause the bit array to fill up too quickly, increasing false positives, and also slow down add/check operations as more hashes need to be computed. The formula gives the sweet spot.

#### Example

Let’s say you expect to add **1 million elements** (n = 1,000,000) and want a **false positive rate of no more than 1%** (p = 0.01).

Using the formulas:

- **Bit array size (m)** = 9,585,059 bits. This is roughly 1.2 MB.
- **Number of hash functions (k)** 7.

These parameters provide a Bloom Filter efficient in memory and accuracy for this scenario.

### Don’t Go Overboard (or Underboard) with Hash Functions

It might seem like using more hash functions would always improve accuracy. However, as explained, the formula for `k` gives an *optimal* value. Deviating significantly from this `k` (given `m` and `n`) will likely increase the false positive probability or slow down operations unnecessarily. Always aim for the calculated optimal `k`.

## Scalable Bloom Filters

In some cases, it’s difficult to predict the exact number of elements (`n`) you’ll be working with ahead of time. This is where **Scalable Bloom Filters** come into play. These filters start with a small initial Bloom filter. When the number of items added to the current filter approaches its planned capacity (the `n` for which it was designed to maintain a target false positive rate `p`), a new, larger filter is created. Subsequent items are added to this new filter. Queries must then check all filters in the sequence. Typically, the size of new filters and their capacities grow geometrically.

Scalable Bloom Filters are useful for dynamic datasets but introduce complexity in managing multiple filters and can have a slightly higher overall false positive rate or slower queries as more filters are added.

## Example Implementation in Go

Here’s a simple implementation of a Bloom Filter in Go:

```go
package bloomfilter

import (
	"fmt"
	"hash"
	"hash/fnv"
	"math"
)

type BloomFilter struct {
	bits      []bool        // The bit array where membership data is stored.
	size      uint          // The size of the bit array.
	hashFuncs []hash.Hash32 // A slice of hash functions used for hashing the input.
}

// New initializes a new Bloom Filter with the given number of elements (n) and
// the desired false positive rate (p). It calculates the size of the bit array
// and the number of hash functions.
func New(n uint, p float64) *BloomFilter {
	// Calculate the optimal size of the bit array (m) based on the formula:
	// m = - (n * ln(p)) / (ln(2))^2
	m := uint(math.Ceil((-float64(n) * math.Log(p)) / (math.Pow(math.Log(2), 2))))

	// Calculate the optimal number of hash functions (k) based on the formula:
	// k = (m / n) * ln(2)
	k := uint(math.Ceil((float64(m) / float64(n)) * math.Log(2)))

	hashes := make([]hash.Hash32, 0, k)
	for i := 0; i < int(k); i++ {
		// Initialize a slice to hold 'k' hash functions. In this example, we
		// are using the same FNV-32 hash function for all 'k' functions.
		// Ideally, we would use different hash functions or hash functions that
		// support seeding to improve distribution and reduce collisions. To
		// compensate for this, we will append a unique seed suffix to each key
		// to simulate different hash functions, ensuring diversity in hash
		// outputs.
		// Note that sadly we cannot pass a seed to the fnv hash in Go to
		// generate k different hashes.
		hashes = append(hashes, fnv.New32())
	}

	return &BloomFilter{
		bits:      make([]bool, m),
		size:      m,
		hashFuncs: hashes,
	}
}

// Add adds a new element (key) to the Bloom Filter.
// This operation sets the bits in the bit array based on the hashed values of
// the key.
func (bf *BloomFilter) Add(key string) {
	indices := bf.hashes(key)
	for _, index := range indices {
		bf.bits[index] = true
	}
}

// Has checks if a given element (key) might be in the Bloom Filter.
// It returns true if the element might exist, and false if it is definitely not
// in the filter.
func (bf *BloomFilter) Has(key string) bool {
	indices := bf.hashes(key)
	for _, index := range indices {
		if !bf.bits[index] {
			return false
		}
	}

	return true
}

// hashes generates the indices in the bit array based on the key using multiple
// hash functions.
func (bf *BloomFilter) hashes(key string) []uint {
	indices := make([]uint, 0, len(bf.hashFuncs))
	for i, h := range bf.hashFuncs {
		h.Reset()

		// Generate a unique string by appending a seed value (based on hash
		// function index). This ensures that each hash function produces
		// different outputs for the same key.
		_, _ = h.Write([]byte(fmt.Sprintf("%s:seed%d", key, i)))

		// Calculate the hash and compute the index in the bit array using
		// modulo operation
		indices = append(indices, uint(h.Sum32())%bf.size)
	}

	return indices
}
```

And here's the driver / test file to verify our implementation:

```go
package bloomfilter

import (
	"fmt"
	"testing"

	"github.com/stretchr/testify/assert"
)

const (
	filterSize        = 1000000
	falsePositiveRate = 0.01
)

func TestBloomFilter(t *testing.T) {
	bf := New(filterSize, falsePositiveRate)

	bf.Add("item-1")
	bf.Add("item-2")
	bf.Add("item-3")

	count := 0
	for _, val := range bf.bits {
		if val == true {
			count++
		}
	}

	assert.True(t, bf.Has("item-1"))
	assert.True(t, bf.Has("item-2"))
	assert.True(t, bf.Has("item-3"))
	assert.False(t, bf.Has("item-4"))
}

func BenchmarkBloomFilter_Add(b *testing.B) {
	bf := New(filterSize, falsePositiveRate)

	for i := 0; i < b.N; i++ {
		bf.Add(fmt.Sprintf("item-%d", i))
	}
}

func BenchmarkBloomFilter_Has(b *testing.B) {
	bf := New(filterSize, falsePositiveRate)

	for i := 0; i < b.N; i++ {
		bf.Add(fmt.Sprintf("item-%d", i))
	}

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		bf.Has(fmt.Sprintf("item-%d", i%500))
	}
}
```

### Benchmark Results
To measure the performance of the Bloom Filter, we ran the following benchmark:

```bash
$ go test -bench=.
```

```bash
goos: linux
goarch: amd64
pkg: github.com/xanish/bloom-filter
cpu: AMD Ryzen 5 7600X 6-Core Processor
BenchmarkBloomFilter_Add-12      1636203               689.0 ns/op
BenchmarkBloomFilter_Has-12      1832988               653.4 ns/op
PASS
ok      github.com/xanish/bloom-filter  5.686s
```

These sub-microsecond operations for `Add` and `Has` are incredibly fast. This speed is especially valuable when a "no" answer from `Has()` might save milliseconds or even seconds by avoiding a disk lookup, a network call, or other expensive computations.

You can check out the repo on my [GitHub](https://github.com/xanish/bloom-filter)

## Conclusion

Bloom Filters are a fantastic tool for efficiently checking membership in large sets while minimizing memory usage. They’re especially useful in applications where some probabilistic uncertainty (false positives) is an acceptable trade-off for significant speed and memory gains. Remember, they can tell you if an element is *definitely not* in a set or *possibly* in a set.

Key limitations to remember:

- They have false positives (though the rate is tunable).
- Standard Bloom filters don't support element deletion.
- They don't store the elements themselves, only their presence.
- Optimal configuration requires a good estimate of the number of items to be inserted.

By understanding how Bloom Filters work, their trade-offs, and how to calculate their parameters, you can optimize performance in a variety of applications. And if you’re concerned about the limitations of fixed-size filters for dynamically growing datasets, Scalable Bloom Filters offer a viable alternative.

If you’re interested in trying it out, implementing one (like the Go example) is a great way to solidify your understanding!

## References

- [Bloom Filter (Wikipedia)](https://en.wikipedia.org/wiki/Bloom_filter)
- [Scalable Bloom Filters (Original Paper by Almeida et al.)](https://gsd.di.uminho.pt/members/cbm/ps/dbloom.pdf)
- [Bloom Filter Calculator (Online Tool by Thomas Hurst)](https://hur.st/bloomfilter/)
- [Less Hashing, Same Performance: Building a Better Bloom Filter (Kirsch & Mitzenmacher, for advanced hashing techniques)](https://www.eecs.harvard.edu/~michaelm/postscripts/rsa2008.pdf)
